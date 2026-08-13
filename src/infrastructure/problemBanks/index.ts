import type { Problem } from '@domain/Problem'

import { CLASSIC_PROBLEMS } from './classic'
import { ASYNC_PROBLEMS } from './async'
import { GENERATOR_PROBLEMS } from './generators'
import { REACT_PROBLEMS } from './react'
import { STREAMING_PROBLEMS } from './streaming'
import { DESIGN_SYSTEM_PROBLEMS } from './designSystem'

export { CLASSIC_PROBLEMS }
export { ASYNC_PROBLEMS }
export { GENERATOR_PROBLEMS }
export { REACT_PROBLEMS }
export { STREAMING_PROBLEMS }
export { DESIGN_SYSTEM_PROBLEMS }

export const PROBLEM_BANK: Problem[] = [
  ...CLASSIC_PROBLEMS,
  ...ASYNC_PROBLEMS,
  ...GENERATOR_PROBLEMS,
  ...REACT_PROBLEMS,
  ...STREAMING_PROBLEMS,
  ...DESIGN_SYSTEM_PROBLEMS,
].slice().sort((a, b) => a.num - b.num)
