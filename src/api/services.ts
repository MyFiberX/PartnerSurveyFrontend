/**
 * API services, one per controller.
 *
 * Deliberately omitted: POST /api/Users/register. The backend still exposes it,
 * but this frontend provides no registration entry point.
 */
import { request } from './http'
import type {
  AuthResponse,
  ChangePasswordRequest,
  DeleteAllSurveysResult,
  LoginRequest,
  PagedResult,
  PaginationParams,
  RatingCriterionRequest,
  RatingCriterionResponse,
  RatingRequest,
  RatingResponse,
  RatingUpdate,
  SurveyRequest,
  SurveyResponse,
  SurveyUpdate,
  UserResponse,
} from './types'

function pageQuery(params: PaginationParams) {
  return {
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
    search: params.search?.trim() || undefined,
  }
}

/** Controllers\UsersController.cs */
export const authService = {
  /** POST /api/Users/login — anonymous. */
  login(payload: LoginRequest, signal?: AbortSignal) {
    return request<AuthResponse>('/api/Users/login', {
      method: 'POST',
      body: payload,
      anonymous: true,
      signal,
    })
  },
}

export const usersService = {
  /** GET /api/Users/me — any authenticated user. */
  me(signal?: AbortSignal) {
    return request<UserResponse>('/api/Users/me', { signal })
  },

  /** GET /api/Users — Admin only. search matches userName. */
  list(params: PaginationParams, signal?: AbortSignal) {
    return request<PagedResult<UserResponse>>('/api/Users', { query: pageQuery(params), signal })
  },

  /** GET /api/Users/{id} — Admin only. */
  getById(id: string, signal?: AbortSignal) {
    return request<UserResponse>(`/api/Users/${id}`, { signal })
  },

  /** PUT /api/Users/me/password — any authenticated user. Failures map to 400, not 404. */
  changePassword(payload: ChangePasswordRequest, signal?: AbortSignal) {
    return request<UserResponse>('/api/Users/me/password', {
      method: 'PUT',
      body: payload,
      signal,
    })
  },

  /**
   * PUT /api/Users/{id}/active?isActive=... — Admin only.
   * isActive is a query parameter; this endpoint takes no request body.
   */
  setActive(id: string, isActive: boolean, signal?: AbortSignal) {
    return request<UserResponse>(`/api/Users/${id}/active`, {
      method: 'PUT',
      query: { isActive },
      signal,
    })
  },

  /**
   * DELETE /api/Users/{id} — Admin only. Permanent.
   * 400 when the user is missing or is the caller's own account.
   */
  remove(id: string, signal?: AbortSignal) {
    return request<null>(`/api/Users/${id}`, { method: 'DELETE', signal })
  },
}

/** Controllers\SurveysController.cs */
export const surveysService = {
  /** POST /api/Surveys — anonymous, so partners can submit without an account. */
  create(payload: SurveyRequest, signal?: AbortSignal) {
    return request<SurveyResponse>('/api/Surveys', {
      method: 'POST',
      body: payload,
      anonymous: true,
      signal,
    })
  },

  /** GET /api/Surveys — authenticated. search matches companyName OR phone. */
  list(params: PaginationParams, signal?: AbortSignal) {
    return request<PagedResult<SurveyResponse>>('/api/Surveys', {
      query: pageQuery(params),
      signal,
    })
  },

  /** GET /api/Surveys/{id} — authenticated. */
  getById(id: string, signal?: AbortSignal) {
    return request<SurveyResponse>(`/api/Surveys/${id}`, { signal })
  },

  /** PUT /api/Surveys/{id} — authenticated. Patch semantics: only non-null fields apply. */
  update(id: string, payload: SurveyUpdate, signal?: AbortSignal) {
    return request<SurveyResponse>(`/api/Surveys/${id}`, {
      method: 'PUT',
      body: payload,
      signal,
    })
  },

  /** DELETE /api/Surveys/{id} — Admin only. Permanent; cascades to the survey's ratings. */
  remove(id: string, signal?: AbortSignal) {
    return request<null>(`/api/Surveys/${id}`, { method: 'DELETE', signal })
  },

  /**
   * DELETE /api/Surveys/all?confirm=true — Admin only. Permanently deletes every
   * survey and rating; criteria and users are kept. Without confirm=true → 400.
   */
  removeAll(signal?: AbortSignal) {
    return request<DeleteAllSurveysResult>('/api/Surveys/all', {
      method: 'DELETE',
      query: { confirm: true },
      signal,
    })
  },
}

/** Controllers\RatingCriteriaController.cs */
export const ratingCriteriaService = {
  /** GET /api/RatingCriteria — anonymous. search matches labelAr. Ordered by `order` DESC. */
  list(params: PaginationParams, signal?: AbortSignal) {
    return request<PagedResult<RatingCriterionResponse>>('/api/RatingCriteria', {
      query: pageQuery(params),
      anonymous: true,
      signal,
    })
  },

  /** GET /api/RatingCriteria/{id} — anonymous. 404 message is the literal "Not ". */
  getById(id: string, signal?: AbortSignal) {
    return request<RatingCriterionResponse>(`/api/RatingCriteria/${id}`, {
      anonymous: true,
      signal,
    })
  },

  /** POST /api/RatingCriteria — authenticated. Returns no success message. */
  create(payload: RatingCriterionRequest, signal?: AbortSignal) {
    return request<RatingCriterionResponse>('/api/RatingCriteria', {
      method: 'POST',
      body: payload,
      signal,
    })
  },

  /**
   * DELETE /api/RatingCriteria/{id} — Admin only. Permanent.
   * 400 when missing or when any rating still references the criterion.
   */
  remove(id: string, signal?: AbortSignal) {
    return request<null>(`/api/RatingCriteria/${id}`, { method: 'DELETE', signal })
  },
}

/** Controllers\RatingsController.cs */
export const ratingsService = {
  /**
   * POST /api/Ratings — anonymous, so the public survey can submit scores.
   * Rejects an out-of-range score, an unknown id, or a duplicate
   * (responseId, criterionId); each failure arrives as an Arabic `message`.
   */
  create(payload: RatingRequest, signal?: AbortSignal) {
    return request<RatingResponse>('/api/Ratings', {
      method: 'POST',
      body: payload,
      anonymous: true,
      signal,
    })
  },

  /** GET /api/Ratings — authenticated. No search, and no filter by survey. */
  list(params: PaginationParams, signal?: AbortSignal) {
    return request<PagedResult<RatingResponse>>('/api/Ratings', {
      query: pageQuery(params),
      signal,
    })
  },

  /** GET /api/Ratings/{id} — authenticated. */
  getById(id: string, signal?: AbortSignal) {
    return request<RatingResponse>(`/api/Ratings/${id}`, { signal })
  },

  /** PUT /api/Ratings/{id} — authenticated. Patch semantics. */
  update(id: string, payload: RatingUpdate, signal?: AbortSignal) {
    return request<RatingResponse>(`/api/Ratings/${id}`, {
      method: 'PUT',
      body: payload,
      signal,
    })
  },

  /** DELETE /api/Ratings/{id} — Admin only. Permanent. */
  remove(id: string, signal?: AbortSignal) {
    return request<null>(`/api/Ratings/${id}`, { method: 'DELETE', signal })
  },
}
