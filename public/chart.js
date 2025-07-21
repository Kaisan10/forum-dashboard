let statsChart, activityChart;
let appConfig = {};

async function initializeApp() {
    try {
        // 設定を取得
        const configResponse = await fetch('/api/config');
        appConfig = await configResponse.json();
        
        // データ読み込み
        await loadAllData();

        // フォーラム情報読み込み
        await loadForumAbout();
        
        // 定期更新設定
        setInterval(() => {
            loadAllData();
            loadForumAbout();
        }, appConfig.refreshInterval);
        
    } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
    }
}

async function loadAllData() {
    try {
        const [statsResponse, usersResponse, historyResponse] = await Promise.all([
            fetch('/api/stats'),
            fetch('/api/users'),
            fetch('/api/history')
        ]);

const statsData = await statsResponse.json();
const users = await usersResponse.json();
const history = await historyResponse.json();

const about = statsData.about || {};
const stats = about.stats || {};

displayForumInfo(about);
displayStats(stats);
displayUsers(statsData.users || [], about.admin_ids || [], about.moderator_ids || []);
        updateCharts(history);
        
        document.getElementById('lastUpdated').textContent = new Date().toLocaleString('ja-JP');
        
    } catch (error) {
        console.error('データ読み込みエラー:', error);
    }
}

async function loadForumAbout() {
    try {
        const res = await fetch('/api/about');
        if (!res.ok) throw new Error('about取得失敗');
        const data = await res.json();
        const about = data.about || {};

        document.getElementById('forumTitle').textContent = about.title || 'タイトルなし';
        document.getElementById('forumDescription').textContent = about.description || '説明なし';

        // site_creation_date優先
        const creationDate = about.site_creation_date || about.created_at;
        document.getElementById('creationDate').textContent =
            `作成日: ${creationDate ? new Date(creationDate).toLocaleDateString('ja-JP') : '不明'}`;

        // about.version優先
        document.getElementById('version').textContent =
            `バージョン: ${about.version || data.version || '不明'}`;
    } catch (error) {
        console.error('フォーラム情報読み込みエラー:', error);
    }
}

function displayForumInfo(about) {
    document.getElementById('forumTitle').textContent = about.title || 'フォーラム名不明';
    document.getElementById('forumDescription').textContent = about.description || '説明なし';

    const creationDate = about.site_creation_date ?
        new Date(about.site_creation_date).toLocaleDateString('ja-JP') : '不明';
    document.getElementById('creationDate').textContent = `作成日: ${creationDate}`;

    document.getElementById('version').textContent = `バージョン: ${about.version || '不明'}`;
    document.getElementById('forumUrl').innerHTML = `URL: <a href="${appConfig.forumUrl}" target="_blank" style="color: #667eea;">${appConfig.forumUrl}</a>`;
}

function displayStats(stats) {
    const statsSection = document.getElementById('statsSection');
    statsSection.innerHTML = '';

    const statCategories = [
        { key: 'topics_count', label: '総トピック数', icon: '<i class="fa-solid fa-file-pen"></i>' },
        { key: 'posts_count', label: '総投稿数', icon: '<i class="fa-solid fa-comment"></i>' },
        { key: 'users_count', label: '総ユーザー数', icon: '<i class="fa-solid fa-users"></i>' },
        { key: 'likes_count', label: '総いいね数', icon: '<i class="fa-solid fa-heart"></i>' },
        { key: 'active_users_30_days', label: '月間アクティブユーザー', icon: '<i class="fa-solid fa-fire"></i>' },
        { key: 'chat_messages_count', label: 'チャットメッセージ数', icon: '<i class="fa-solid fa-comments"></i>' }
    ];

    statCategories.forEach(stat => {
        if (stats.hasOwnProperty(stat.key)) {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-number">${stats[stat.key].toLocaleString()}</div>
                <div class="stat-label">${stat.icon} ${stat.label}</div>
            `;
            statsSection.appendChild(card);
        }
    });
}

function displayUsers(users, adminIds, moderatorIds) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';

    // configからベースURLを取得
    const forumBaseUrl = appConfig.forumUrl || "https://forum.bac0n.f5.si";

    users.forEach(userData => {
        // avatar_templateのURLを生成（先頭にベースURLを付与）
        const avatarUrl = userData.avatar_template
            ? forumBaseUrl + userData.avatar_template.replace('{size}', '64')
            : 'https://via.placeholder.com/64?text=?';

        const userCard = document.createElement('div');
        userCard.className = 'user-card';

        const lastSeen = userData.last_seen_at
            ? new Date(userData.last_seen_at).toLocaleString('ja-JP')
            : '不明';

        const isAdmin = adminIds.includes(userData.id);
        const isModerator = moderatorIds.includes(userData.id);

        let badges = '';
        if (isAdmin) badges += '<span class="admin-badge">管理者</span>';
        if (isModerator && !isAdmin) badges += '<span class="moderator-badge">モデレーター</span>';

        userCard.innerHTML = `
            <img class="user-avatar" src="${avatarUrl}" alt="${userData.username}" />
            <div class="user-info">
                <div class="username">${userData.username}${badges}</div>
                <div class="user-title">${userData.title || '役職なし'}</div>
                <div class="last-seen">最終ログイン: ${lastSeen}</div>
            </div>
        `;
        usersList.appendChild(userCard);
    });

    if (users.length === 0) {
        usersList.innerHTML = '<p style="text-align: center; color: #718096;">ユーザー情報がありません</p>';
    }
}

function updateCharts(history) {
    if (history.length === 0) return;

    // ラベル（日時）を生成
    const labels = history.map(entry =>
        entry.timestamp ? new Date(entry.timestamp).toLocaleString('ja-JP') : ''
    );

    // 統計チャート
    const ctx1 = document.getElementById('statsChart').getContext('2d');
    if (statsChart) statsChart.destroy();

    statsChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'トピック数',
                    data: history.map(entry => entry.topics_count),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                },
                {
                    label: '投稿数',
                    data: history.map(entry => entry.posts_count),
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // アクティビティチャート
    const ctx2 = document.getElementById('activityChart').getContext('2d');
    if (activityChart) activityChart.destroy();

    activityChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'アクティブユーザー',
                    data: history.map(entry => entry.active_users_30_days),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1
                },
                {
                    label: 'いいね数',
                    data: history.map(entry => entry.likes_count),
                    backgroundColor: 'rgba(118, 75, 162, 0.8)',
                    borderColor: '#764ba2',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', initializeApp);
