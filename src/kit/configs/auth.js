export default {
    refreshEndpoint: `${import.meta.env.VITE_BASE_URL}/v1/auth/token/refresh`,
    registerEndpoint: '/jwt/register',
    storageTokenKeyName: 'token',
    storageGalleryTokenKeyName: 'galleryAccessToken',
    storageGalleryIdKeyName: 'galleryId',
    onTokenExpiration: 'refreshToken', // logout | refreshToken
    storageRefreshKeyName: 'refreshToken', // logout | refreshToken
    storageUserDetailName: 'userData',
    storageCompanyDetailName: 'userCompany',
    storageUserIDName: 'userId',
    storageBranchData: 'branchData',
    storageRole: 'role',
    storagePermissions: 'permissions',
}
