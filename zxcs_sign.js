const cookieName = '知轩藏书'
const cookieKey = 'zxcs_cookie'
const signUrl = 'https://zxcsol.com/wp-admin/admin-ajax.php'

function logAndNotify(title, subtitle, message) {
    console.log(`${title}: ${subtitle}\n${message}`);
    $notification.post(title, subtitle, message);
}

!(async () => {
    console.log('============ 开始执行签到脚本 ============');
    try {
        const cookie = $persistentStore.read(cookieKey)
        console.log('读取到的Cookie:', cookie ? '成功' : '失败');
        
        if (!cookie) {
            throw new Error('Cookie不存在，请先获取Cookie')
        }

        // 先获取用户信息，检查登录状态
        const checkLoginRequest = {
            url: 'https://zxcsol.com/wp-admin/admin-ajax.php?action=get_current_user',
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1'
            }
        };

        console.log('正在检查登录状态...');
        $httpClient.get(checkLoginRequest, (error, response, userData) => {
            console.log('登录检查响应:', userData);
            
            if (error || !userData) {
                logAndNotify(cookieName, '登录检查失败 ❌', error || '无响应数据');
                $done({});
                return;
            }

            try {
                const userInfo = JSON.parse(userData);
                console.log('完整的用户信息:', JSON.stringify(userInfo, null, 2));
                
                if (!userInfo.id) {
                    logAndNotify(cookieName, '未登录 ❌', '请重新获取Cookie');
                    $done({});
                    return;
                }

                // 尝试查找可能的积分字段
                const possiblePointsFields = ['points', 'credit', 'credits', 'point', 'score', 'scores'];
                let userPoints = 0;
                for (const field of possiblePointsFields) {
                    if (userInfo[field] !== undefined) {
                        console.log(`找到积分字段: ${field} = ${userInfo[field]}`);
                        userPoints = userInfo[field];
                        break;
                    }
                }

                // 执行签到请求
                console.log('开始执行签到请求...');
                const headers = {
                    'Host': 'zxcsol.com',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Origin': 'https://zxcsol.com',
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
                    'Connection': 'keep-alive',
                    'Referer': 'https://zxcsol.com/',
                    'Cookie': cookie
                }

                const signRequest = {
                    url: signUrl,
                    method: 'POST',
                    headers: headers,
                    body: 'action=user_checkin'
                }

                console.log('发送签到请求...');
                $httpClient.post(signRequest, (error, response, data) => {
                    console.log('签到响应状态码:', response ? response.status : 'unknown');
                    console.log('签到原始响应:', data);

                    if (error) {
                        logAndNotify(cookieName, '签到失败 ❌', '请求异常：' + error);
                        $done({});
                        return;
                    }

                    // 获取最新用户信息
                    console.log('获取最新用户信息...');
                    $httpClient.get(checkLoginRequest, (error, response, newUserData) => {
                        try {
                            const oldPoints = userInfo.points || 0;
                            const newUserInfo = JSON.parse(newUserData);
                            const newPoints = newUserInfo.points || 0;
                            const gainedPoints = newPoints - oldPoints;

                            const now = new Date();
                            const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                            let message = `时间：${timeStr}\n`;
                            message += `当前积分：${newPoints}`;
                            if (gainedPoints > 0) {
                                message += `\n本次获得：${gainedPoints} 积分 🎁`;
                            }

                            logAndNotify(
                                `${cookieName} 🔔`,
                                gainedPoints > 0 ? '签到成功 ✓' : '今日已签到 ✓',
                                message
                            );
                        } catch (e) {
                            console.log('处理用户信息失败:', e);
                            logAndNotify(cookieName, '签到可能成功 ✓', `时间：${timeStr}\n但获取积分信息失败`);
                        }
                        $done({});
                    });
                });
            } catch (e) {
                console.log('解析用户信息失败:', e);
                logAndNotify(cookieName, '签到失败 ❌', '解析用户信息失败：' + e.message);
                $done({});
            }
        });
    } catch (e) {
        console.log('执行异常:', e);
        logAndNotify(cookieName, '签到异常 ❌', e.message);
        $done({});
    }
})();