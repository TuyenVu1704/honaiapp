export const convertoIPv4 = async (ip: string) => {
  // Xử lý IPvp4 mappped IPv6
  if (ip.substring(0, 7) === '::ffff:') {
    return ip.substring(7)
  }

  // Xử lý IPvp6 localhost
  if (ip === '::1' || ip === '0000:0000:0000:0000:0000:0000:0000:0001') {
    return '127.0.0.1'
  }
  // Xử lý các địa chỉ IPv6 khác
  const ipv6Regex = /^([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$/
  if (ipv6Regex.test(ip)) {
    // Chuyển đổi IPv6 thành IPv4 nếu có thể
    const parts = ip.split(':')
    const last2Parts = parts.slice(-2)
    const ipv4Parts = last2Parts.map((part) => parseInt(part, 16))
    if (ipv4Parts.every((part) => part >= 0 && part <= 255)) {
      return ipv4Parts.join('.')
    }
    // Nếu không thể chuyển đổi, trả về địa chỉ gốc
    return ip
  }

  // Nếu không thể chuyển đổi, trả về địa chỉ gốc
  return ip
}
