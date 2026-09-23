/**
 * Types mirroring the PartnerSurvey API DTOs.
 *
 * Field names match the backend's camelCase JSON exactly. No field here is
 * invented: each one is present on the corresponding C# DTO.
 */

/** Common\ApiResponse.cs — the envelope returned by every endpoint. */
export interface ApiResponse<T> {
  success: boolean
  message: string | null
  data: T | null
  errors: string[]
}

/** Common\PagedResult.cs — totalPages/hasPrevious/hasNext are computed server-side. */
export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/** Common\PaginationParams.cs — clamped silently: pageNumber >= 1, pageSize 1..100. */
export interface PaginationParams {
  pageNumber?: number
  pageSize?: number
  search?: string
}

export const PAGE_SIZE_DEFAULT = 10
export const PAGE_SIZE_MAX = 100

/** Entities\User.cs */
export type Role = 'Admin' | 'User'

/** Entities\DTOs\UserDto\LoginRequest.cs */
export interface LoginRequest {
  userName: string
  password: string
}

/** Entities\DTOs\UserDto\UserResponse.cs — note `createAt`, not `createdAt`. */
export interface UserResponse {
  id: string
  userName: string
  role: Role
  isActive: boolean
  createAt: string
  lastLoginAt: string | null
}

/** Entities\DTOs\UserDto\AuthResponse.cs */
export interface AuthResponse {
  token: string
  expiresAt: string
  user: UserResponse
}

/** Entities\DTOs\UserDto\ChangePasswordRequest.cs — newPassword is 6..100 server-side. */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/** Entities\DTOs\SurveyDto\SurveyRequest.cs — no DataAnnotations on the server. */
export interface SurveyRequest {
  companyName: string
  phone: string
  feedback?: string | null
}

/** Entities\DTOs\SurveyDto\SurveyUpdate.cs — patch semantics: only non-null fields apply. */
export interface SurveyUpdate {
  companyName?: string | null
  phone?: string | null
  feedback?: string | null
}

/**
 * Entities\DTOs\SurveyDto\SurveyResponse.cs
 * Deliberately has no createAt/updateAt/ratings — the server does not expose them.
 */
export interface SurveyResponse {
  id: string
  companyName: string
  phone: string
  feedback: string | null
}

/** `data` of DELETE /api/Surveys/all — both counts are 0 when nothing existed. */
export interface DeleteAllSurveysResult {
  deletedSurveys: number
  deletedRatings: number
}

/** Entities\DTOs\RatingCriterionDto\RatingCriterionRequest.cs — no DataAnnotations. */
export interface RatingCriterionRequest {
  labelAr: string
  scaleMin: number
  scaleMax: number
  order: number
  isRequired: boolean
  isActive: boolean
}

/**
 * Entities\DTOs\RatingCriterionDto\RatingCriterionRespons.cs
 * The C# type is spelled `RatingCriterionRespons` (no trailing "e"); only the
 * JSON shape matters here, so this uses the corrected spelling.
 */
export interface RatingCriterionResponse {
  id: string
  labelAr: string
  scaleMin: number
  scaleMax: number
  order: number
  isRequired: boolean
  isActive: boolean
  createAt: string
}

/**
 * Entities\DTOs\RatingDto\RatingRequest.cs
 * `responseId` is a Survey id: the server calls the survey a "response".
 * A unique constraint on (responseId, criterionId) rejects a second score for
 * the same criterion on the same survey.
 */
export interface RatingRequest {
  responseId: string
  criterionId: string
  score: number
}

/** Entities\DTOs\RatingDto\RatingUpdate.cs — patch semantics, as with surveys. */
export interface RatingUpdate {
  responseId?: string | null
  criterionId?: string | null
  score?: number | null
}

/**
 * Entities\DTOs\RatingDto\RatingResponse.cs
 * Carries no criterion label: pages needing one join against RatingCriteria.
 */
export interface RatingResponse {
  id: string
  responseId: string
  criterionId: string
  score: number
}
