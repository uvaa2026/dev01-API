import bcrypt from 'bcryptjs'

// bcryptjs (pure JS, no native compilation step) rather than the native
// `bcrypt` or `argon2` packages — those need node-gyp + a C++ toolchain at
// install time, which is exactly the kind of native-binary dependency that
// tends to 404 or hang on locked-down corporate npm registries. bcryptjs is
// slightly slower per hash; at this scale (login attempts, not a hot loop)
// that's a non-issue.
const SALT_ROUNDS = 12

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS)
}

export async function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash)
}
