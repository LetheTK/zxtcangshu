const cookieName = '知轩藏书'
const cookieKey = 'zxcs_cookie'

function getCookie() {
    // 只匹配登录和个人页面的请求
    const regex = /^https:\/\/zxcsol\.com\/(wp-admin\/admin-ajax\.php|update|user)/

    const url = $request.url
    if (!regex.test(url)) {
        console.log('URL不匹配:', url)
        $done({})
        return
    }

    const cookieVal = $request.headers['Cookie'] || $request.headers['cookie']
    console.log('获取到的Cookie:', cookieVal)

    if (cookieVal) {
        // 检查是否包含登录Cookie
        if (cookieVal.includes('wordpress_logged_in_140e9c6ed7a3d790ec814fc185451937')) {
            try {
                const oldCookie = $persistentStore.read(cookieKey)
                if (oldCookie !== cookieVal) {
                    $persistentStore.write(cookieVal, cookieKey)
                    $notification.post(cookieName, 'Cookie更新成功 🎉', '')
                } else {
                    console.log('Cookie没有变化')
                }
            } catch(e) {
                console.log('写入失败:', e)
                $notification.post(cookieName, 'Cookie保存失败 ❌', e.message || '未知错误')
            }
        } else {
            console.log('未找到登录Cookie')
            $notification.post(cookieName, 'Cookie获取失败 ❌', '请先登录网站')
        }
    } else {
        console.log('请求中没有Cookie')
        $notification.post(cookieName, 'Cookie获取失败 ❌', '未找到Cookie')
    }
    
    $done({})
}

getCookie()