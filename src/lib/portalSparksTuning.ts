import defaults from './portalSparksTuning.json'

/** Tuning parameters for the portal sparks particle effect. */
export type PortalSparksTuning = {
  /** Maximum number of live particles */
  MAX_PARTICLES: number
  /** Particles emitted per second at intensity 1.0 */
  SPAWN_RATE: number
  /** Minimum particle lifetime (seconds) */
  LIFETIME_MIN: number
  /** Maximum particle lifetime (seconds) */
  LIFETIME_MAX: number
  /** Minimum tangential speed along the ring (CSS px/s) */
  TANGENT_SPEED_MIN: number
  /** Maximum tangential speed along the ring (CSS px/s) */
  TANGENT_SPEED_MAX: number
  /** Minimum radial outward drift speed (CSS px/s) */
  RADIAL_SPEED_MIN: number
  /** Maximum radial outward drift speed (CSS px/s) */
  RADIAL_SPEED_MAX: number
  /** Elliptical gravity strength (omega squared for harmonic oscillator) */
  GRAVITY_STRENGTH: number
  /** Minimum particle size in px (before DPR) */
  SIZE_MIN: number
  /** Maximum particle size in px (before DPR) */
  SIZE_MAX: number
  /** Streak length-to-width ratio */
  STREAK_ASPECT: number
  /** Minimum base brightness */
  BRIGHTNESS_MIN: number
  /** Maximum base brightness */
  BRIGHTNESS_MAX: number
  /** Chance of a "hot" (extra bright) spark */
  HOT_SPARK_CHANCE: number
  /** Brightness multiplier for hot sparks */
  HOT_SPARK_MULT: number
  /** Life fraction at which fade-out begins */
  FADE_OUT_START: number
  /** Global rotation speed around portal center (rad/s, negative = CW) */
  GLOBAL_SPIN: number
}

/**
 * Mutable runtime tuning values.
 * Initialized from the JSON file; the configurator mutates this in place.
 */
export const SPARK_TUNING: PortalSparksTuning = { ...defaults }

/** Default values from the JSON file, used for slider ranges and reset. */
export const SPARK_TUNING_DEFAULTS: Readonly<PortalSparksTuning> = defaults
