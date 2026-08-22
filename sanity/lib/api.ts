/**
 * As this file is reused in several other files, try to keep it lean and small.
 * Importing other npm packages here could lead to needlessly increasing the client bundle size, or end up in a server-only function that don't need it.
 */

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  envVarHint('NEXT_PUBLIC_SANITY_DATASET'),
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  envVarHint('NEXT_PUBLIC_SANITY_PROJECT_ID'),
)

// see https://www.sanity.io/docs/api-versioning for how versioning works
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-02-27'

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}

// Kept terse on purpose (see file-level note above); still points straight at the fix instead
// of leaving readers with a bare "undefined" crash.
function envVarHint(name: string): string {
  return (
    `Missing environment variable: ${name}. Locally, copy .env.local.example to .env.local and ` +
    `fill in the values from https://manage.sanity.io. On Vercel, add ${name} in Project Settings ` +
    '→ Environment Variables, and make sure the checkbox for the environment being built ' +
    '(Production and/or Preview) is enabled — a var scoped only to Production will not be ' +
    'available to Preview deployments. See vercel-installation-instructions.md for details.'
  )
}
/**
 * Used to configure edit intent links, for Presentation Mode, as well as to configure where the Studio is mounted in the router.
 */
export const studioUrl = '/studio'
