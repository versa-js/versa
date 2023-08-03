const defaults = {
	base: '/versa'
}
const env = Object.assign( defaults,  window.versaEnv || {})

export default env;