import api from './shared/apiUtils';

const ENV_PREFIX = process.env.NODE_ENV === 'production' ? '/ap-editor/api' : 'http://localhost:8000';

export const urls = {
  applicationPackages: {
    list: () => `${ENV_PREFIX}/aps/`,
    detail: apSlug => `${ENV_PREFIX}/aps/${apSlug}/`,
  },
  applicationPackageVersions: {
    list: apSlug => `${ENV_PREFIX}/aps/${apSlug}/versions/`,
    detail: {
      base: (apSlug, versionSlug) => `${ENV_PREFIX}/aps/${apSlug}/versions/${versionSlug}/`,
      lock: (apSlug, versionSlug) => `${ENV_PREFIX}/aps/${apSlug}/versions/${versionSlug}/lock/`,
      unlock: (apSlug, versionSlug) => `${ENV_PREFIX}/aps/${apSlug}/versions/${versionSlug}/unlock/`,
    },
  }
};

export const listApplicationPackages = () => api.get(urls.applicationPackages.list());
export const listApplicationPackageVersions = apSlug => api.get(urls.applicationPackageVersions.list(apSlug));

export const getApplicationPackageVersion =
  (apSlug, versionSlug) => api.get(urls.applicationPackageVersions.detail.base(apSlug, versionSlug));

export const createUpdateApplicationPackageVersion = (apSlug, versionSlug, payload) =>
  api.put(urls.applicationPackageVersions.detail.base(apSlug, versionSlug), payload);

export const lockApplicationPackageVersion = (apSlug, versionSlug) =>
  api.patch(urls.applicationPackageVersions.detail.lock(apSlug, versionSlug));
export const unlockApplicationPackageVersion = (apSlug, versionSlug) =>
  api.patch(urls.applicationPackageVersions.detail.unlock(apSlug, versionSlug));

export const deleteApplicationPackage = apSlug =>
  api.delete(urls.applicationPackages.detail(apSlug));
export const deleteApplicationPackageVersion = (apSlug, versionSlug) =>
  api.delete(urls.applicationPackageVersions.detail.base(apSlug, versionSlug));
