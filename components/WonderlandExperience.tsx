'use client'

import {useEffect, useRef} from 'react'

import styles from './WonderlandExperience.module.css'

const vertexShader = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m *= m;
    m *= m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = st * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    vec2 m = u_mouse * 2.0 - 1.0;
    m.x *= u_resolution.x / u_resolution.y;
    float distanceToMouse = length(p - m);
    float ripple = smoothstep(0.72, 0.0, distanceToMouse);
    vec2 distortedUv = st + (p - m) * ripple * 0.15 * sin(u_time * 2.0 - distanceToMouse * 5.0);

    float n = snoise(distortedUv * 3.0 + u_time * 0.2);
    float n2 = snoise(distortedUv * 6.0 - u_time * 0.3);
    vec3 dark = vec3(0.008, 0.03, 0.014);
    vec3 forest = vec3(0.025, 0.17, 0.08);
    vec3 iridescent = vec3(0.04, 0.36, 0.26);
    vec3 glowColor = vec3(0.30, 0.85, 0.52);

    vec3 color = mix(dark, forest, n + 0.5);
    color = mix(color, iridescent, n2 * 0.5 + 0.5);
    float glow = smoothstep(0.8, 0.0, distanceToMouse);
    color += glowColor * glow * 0.28 * (1.0 + sin(u_time * 4.0) * 0.2);
    gl_FragColor = vec4(color, 1.0);
  }
`

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

export function WonderlandExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', {antialias: true})
    if (!canvas || !gl) return

    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader)
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader)
    if (!vertex || !fragment) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    const buffer = gl.createBuffer()
    if (!buffer) return
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    const position = gl.getAttribLocation(program, 'a_position')
    const resolution = gl.getUniformLocation(program, 'u_resolution')
    const mouseUniform = gl.getUniformLocation(program, 'u_mouse')
    const time = gl.getUniformLocation(program, 'u_time')
    const mouse = {x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5}
    let frame = 0

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio, 2)
      canvas.width = Math.floor(window.innerWidth * pixelRatio)
      canvas.height = Math.floor(window.innerHeight * pixelRatio)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const move = (event: PointerEvent) => {
      mouse.targetX = event.clientX / window.innerWidth
      mouse.targetY = 1 - event.clientY / window.innerHeight
    }

    const start = performance.now()
    const render = (now: number) => {
      mouse.x += (mouse.targetX - mouse.x) * 0.05
      mouse.y += (mouse.targetY - mouse.y) * 0.05
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(position)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(resolution, canvas.width, canvas.height)
      gl.uniform2f(mouseUniform, mouse.x, mouse.y)
      gl.uniform1f(time, (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      frame = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', move)
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [])

  return (
    <main className={styles.experience}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <header className={styles.header}>
        <p>Immersive web experience</p>
        <h1>Wonderland</h1>
      </header>
      <div className={styles.footer}>
        <span>Move to stir the forest</span>
        <span>01 / 01</span>
      </div>
    </main>
  )
}
