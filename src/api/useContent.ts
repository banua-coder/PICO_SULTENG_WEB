import { fetchJson } from './client'
import { ENDPOINTS } from './endpoints'
import {
  isArrayOf,
  isWireBanner,
  isWireDonation,
  isWireHospital,
  isWireInfographic,
  isWirePartner,
  isWireTaskForceGroup,
  isWireTelemedicine,
} from './guards'
import { banners, donations, hospitals, infographics, partners, taskForces, telemedicines } from './normalize/content'
import { useResource } from './resource'
import type { Banner, Donation, Hospital, Infographic, Partner, Resource, TaskForceGroup, Telemedicine } from './types'

export const useHospitals = (): Resource<Hospital[]> =>
  useResource(ENDPOINTS.hospitals.path, (signal) => fetchJson(ENDPOINTS.hospitals.path, { signal, guard: isArrayOf(isWireHospital) }).then(hospitals))

export const useTaskForces = (): Resource<TaskForceGroup[]> =>
  useResource(ENDPOINTS.taskForces.path, (signal) => fetchJson(ENDPOINTS.taskForces.path, { signal, guard: isArrayOf(isWireTaskForceGroup) }).then(taskForces))

export const useBanners = (): Resource<Banner[]> =>
  useResource(ENDPOINTS.banners.path, (signal) => fetchJson(ENDPOINTS.banners.path, { signal, guard: isArrayOf(isWireBanner) }).then(banners))

export const useInfographics = (): Resource<Infographic[]> =>
  useResource(ENDPOINTS.infographics.path, (signal) => fetchJson(ENDPOINTS.infographics.path, { signal, guard: isArrayOf(isWireInfographic) }).then(infographics), { large: true })

export const useDonations = (): Resource<Donation[]> =>
  useResource(ENDPOINTS.donations.path, (signal) => fetchJson(ENDPOINTS.donations.path, { signal, guard: isArrayOf(isWireDonation) }).then(donations))

export const useTelemedicines = (): Resource<Telemedicine[]> =>
  useResource(ENDPOINTS.telemedicines.path, (signal) => fetchJson(ENDPOINTS.telemedicines.path, { signal, guard: isArrayOf(isWireTelemedicine) }).then(telemedicines))

export const usePartners = (): Resource<Partner[]> =>
  useResource(ENDPOINTS.partners.path, (signal) => fetchJson(ENDPOINTS.partners.path, { signal, guard: isArrayOf(isWirePartner) }).then(partners))
