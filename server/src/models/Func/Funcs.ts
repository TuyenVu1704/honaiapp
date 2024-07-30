import { USER_MESSAGE } from '~/constants/messages'
import RefreshToken, { IRefreshTokenEntry } from '../RefreshToken.schema'

export interface IAddOrUpdateRefreshToken {
  user_id: string
  refresh_token: string
  device_id: string
  device_name: string
  ip: string
}

/**
 * Title:
 */

/**
 * Description: Thêm hoặc cập nhật refresh token
 *
 * @param param0
 * @returns
 */
export const addOrUpdateRefreshToken = async ({
  user_id,
  refresh_token,
  device_id,
  device_name,
  ip
}: IAddOrUpdateRefreshToken): Promise<{
  success: boolean
  message: string
  devices?: IRefreshTokenEntry[]
}> => {
  // Tìm kiếm user đã có refresh token chưa
  const refreshTokenDoc = await RefreshToken.findOne({ user_id })

  // Nếu chưa có thì tạo mới
  if (!refreshTokenDoc) {
    await RefreshToken.create({
      user_id,
      refresh_token: [{ refresh_token, device_id, device_name, ip }]
    })
    return {
      success: true,
      message: 'success'
    }
  } else {
    // Tìm kiếm xem device đã có refresh token chưa
    const deviceIndex = refreshTokenDoc.refresh_token.findIndex((device) => device.device_id === device_id)
    // Nếu đã có thì update lại refresh token
    if (deviceIndex !== -1) {
      // Cập nhật lại refresh token
      refreshTokenDoc.refresh_token[deviceIndex].refresh_token = refresh_token
      refreshTokenDoc.refresh_token[deviceIndex].updated_at = new Date()
      await refreshTokenDoc.save()
      return {
        success: true,
        message: USER_MESSAGE.REFRESH_TOKEN_UPDATED
      }
    }
    // Nếu chưa có thì kiểm tra số lượng thiết bị đã đăng nhập đạt giới hạn là 3 chưa
    else if (refreshTokenDoc.refresh_token.length < 3) {
      {
        // Thêm mới refresh token và device vào danh sách
        refreshTokenDoc.refresh_token.push({
          refresh_token,
          device_id,
          device_name,
          ip,
          created_at: new Date(),
          updated_at: new Date()
        })
        await refreshTokenDoc.save()
        return {
          success: true,
          message: USER_MESSAGE.REFRESH_TOKEN_ADDED_NEW_DEVICE
        }
      }
    } else {
      return {
        success: false,
        message: USER_MESSAGE.REFRESH_TOKEN_LIMIT_DEVICE,
        devices: refreshTokenDoc.refresh_token.map((device) => ({
          created_at: device.created_at,
          updated_at: device.updated_at,
          device_id: device.device_id,
          device_name: device.device_name
        }))
      }
    }
  }
}

/**
 * Description: Xóa refresh token của device
 * @param user_id
 * @param device_id
 * @returns
 */

export const removeDevice = async (user_id: string, device_id: string): Promise<boolean> => {
  const result = await RefreshToken.updateOne({ user_id }, { $pull: { refresh_token: { device_id } } })

  //Modified count > 0: Xóa thành công

  return result.modifiedCount > 0
}
