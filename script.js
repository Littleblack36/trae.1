// 全局数据存储
let matchData = {
    name: '上海交通大学2025年新生杯',
    date: '',
    type: '',
    homeTeam: '',
    awayTeam: '',
    homeScore: 0,
    awayScore: 0,
    homeLineup: [],
    awayLineup: [],
    homeSubstitutes: [],
    awaySubstitutes: [],
    events: [],
    referees: {
        main: '',
        assistant1: '',
        assistant2: '',
        fourth: ''
    }
};

// DOM元素加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化球员添加按钮事件
    document.getElementById('add-home-player').addEventListener('click', () => addPlayer('home', 'lineup'));
    document.getElementById('add-away-player').addEventListener('click', () => addPlayer('away', 'lineup'));
    document.getElementById('add-home-substitute').addEventListener('click', () => addPlayer('home', 'substitute'));
    document.getElementById('add-away-substitute').addEventListener('click', () => addPlayer('away', 'substitute'));
    
    // 事件类型变化监听
    document.getElementById('event-type').addEventListener('change', toggleSubstitutionFields);
    
    // 添加事件按钮
    document.getElementById('add-event').addEventListener('click', addEvent);
    
    // 比分变化监听
    document.getElementById('home-score').addEventListener('input', updateScore);
    document.getElementById('away-score').addEventListener('input', updateScore);
    
    // 导出Excel按钮
    document.getElementById('export-excel').addEventListener('click', exportToExcel);
    
    // 初始化时添加一些示例球员
    initSampleData();
});

// 切换换人字段显示
function toggleSubstitutionFields() {
    const eventType = document.getElementById('event-type').value;
    const playerField = document.getElementById('player-field');
    const substitutionFields = document.getElementById('substitution-fields');
    
    if (eventType === 'substitution') {
        playerField.style.display = 'none';
        substitutionFields.style.display = 'grid';
    } else {
        playerField.style.display = 'grid';
        substitutionFields.style.display = 'none';
    }
}

// 添加球员
function addPlayer(team, type) {
    const container = team === 'home' 
        ? (type === 'lineup' ? document.getElementById('home-lineup') : document.getElementById('home-substitutes'))
        : (type === 'lineup' ? document.getElementById('away-lineup') : document.getElementById('away-substitutes'));
    
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    playerItem.innerHTML = `
        <input type="number" class="player-number" placeholder="号码">
        <input type="text" class="player-name" placeholder="姓名">
        <label class="captain-label">
            <input type="checkbox" class="captain-checkbox"> (C)
        </label>
        <button class="remove-btn">移除</button>
    `;
    
    // 添加移除按钮事件
    playerItem.querySelector('.remove-btn').addEventListener('click', () => {
        container.removeChild(playerItem);
        updatePlayerData();
    });
    
    // 添加输入事件监听
    playerItem.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updatePlayerData);
    });
    
    container.appendChild(playerItem);
    updatePlayerData();
}

// 更新球员数据
function updatePlayerData() {
    // 更新主队首发
    matchData.homeLineup = getPlayersFromContainer('home-lineup');
    // 更新客队首发
    matchData.awayLineup = getPlayersFromContainer('away-lineup');
    // 更新主队替补
    matchData.homeSubstitutes = getPlayersFromContainer('home-substitutes');
    // 更新客队替补
    matchData.awaySubstitutes = getPlayersFromContainer('away-substitutes');
}

// 从容器获取球员数据
function getPlayersFromContainer(containerId) {
    const container = document.getElementById(containerId);
    const players = [];
    
    container.querySelectorAll('.player-item').forEach(item => {
        const number = item.querySelector('.player-number').value;
        const name = item.querySelector('.player-name').value;
        const isCaptain = item.querySelector('.captain-checkbox').checked;
        
        if (number || name) {
            players.push({
                number: number,
                name: name,
                isCaptain: isCaptain
            });
        }
    });
    
    return players;
}

// 添加事件
function addEvent() {
    const minute = document.getElementById('event-minute').value;
    const team = document.getElementById('event-team').value;
    const type = document.getElementById('event-type').value;
    
    if (!minute) {
        alert('请输入时间（分钟）');
        return;
    }
    
    let eventData = {
        minute: parseInt(minute),
        team: team,
        type: type
    };
    
    if (type === 'substitution') {
        const playerOut = document.getElementById('player-out').value;
        const playerIn = document.getElementById('player-in').value;
        
        if (!playerOut || !playerIn) {
            alert('请输入下场和上场球员姓名');
            return;
        }
        
        eventData.playerOut = playerOut;
        eventData.playerIn = playerIn;
    } else {
        const player = document.getElementById('event-player').value;
        
        if (!player) {
            alert('请输入球员姓名');
            return;
        }
        
        eventData.player = player;
        
        // 如果是进球，更新比分
        // 进球类型更新比分
        if (type === 'goal' || type === 'penalty-goal') {
            if (team === 'home') {
                matchData.homeScore++;
                document.getElementById('home-score').value = matchData.homeScore;
            } else {
                matchData.awayScore++;
                document.getElementById('away-score').value = matchData.awayScore;
            }
        }
        // 乌龙球：对方得分
        if (type === 'own-goal') {
            if (team === 'home') {
                matchData.awayScore++;
                document.getElementById('away-score').value = matchData.awayScore;
            } else {
                matchData.homeScore++;
                document.getElementById('home-score').value = matchData.homeScore;
            }
        }
    }
    
    // 添加事件到列表
    matchData.events.push(eventData);
    
    // 按时间排序事件
    matchData.events.sort((a, b) => a.minute - b.minute);
    
    // 更新事件列表显示
    renderEventsList();
    
    // 清空表单
    document.getElementById('event-minute').value = '';
    document.getElementById('event-player').value = '';
    document.getElementById('player-out').value = '';
    document.getElementById('player-in').value = '';
}

// 渲染事件列表
function renderEventsList() {
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '';
    
    matchData.events.forEach((event, index) => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        
        let eventIcon = '';
        let eventText = '';
        
        switch (event.type) {
            case 'goal':
                eventIcon = '⚽';
                eventText = `<span class="event-minute">${event.minute}'</span><span class="event-icon event-type-goal">${eventIcon}</span> 进球: ${event.player}`;
                break;
            case 'own-goal':
                eventIcon = '⚽';
                eventText = `<span class="event-minute">${event.minute}'</span><span class="event-icon event-type-goal">${eventIcon}</span> 乌龙球: ${event.player}`;
                break;
            case 'penalty-goal':
                eventIcon = '⚽';
                eventText = `<span class="event-minute">${event.minute}'</span><span class="event-icon event-type-goal">${eventIcon}</span> 点球进球: ${event.player}`;
                break;
            case 'penalty-miss':
                eventIcon = '❌';
                eventText = `<span class="event-minute">${event.minute}'</span><span class="event-icon event-type-yellow">${eventIcon}</span> 点球不进: ${event.player}`;
                break;
            case 'yellow':
                eventIcon = '🟨';
                eventText = `<span class="event-minute">${event.minute}'</span><span class="event-icon event-type-yellow">${eventIcon}</span> 黄牌: ${event.player}`;
                break;
            case 'straight-red':
                eventIcon = '🟥';
                eventText = `<span class="event-minute">${event.minute}'</span><span class="event-icon event-type-red">${eventIcon}</span> 直红: ${event.player}`;
                break;
            case 'second-yellow':
                eventIcon = '🟨🟥';
                eventText = `<span class="event-minute">${event.minute}'</span><span class="event-icon event-type-red">${eventIcon}</span> 第二张黄牌变红牌: ${event.player}`;
                break;
            case 'substitution':
                eventIcon = '🔄';
                eventText = `<span class="event-minute">${event.minute}'</span><span class="event-icon event-type-substitution">${eventIcon}</span> 换人: <span style="color:red">${event.playerOut} ↓</span> <span style="color:green">${event.playerIn} ↑</span>`;
                break;
        }
        
        eventItem.innerHTML = `
            <div class="event-info">
                <span class="event-team">${event.team === 'home' ? '主队' : '客队'}</span>
                ${eventText}
            </div>
            <button class="remove-btn">移除</button>
        `;
        
        // 添加移除按钮事件
        eventItem.querySelector('.remove-btn').addEventListener('click', () => {
            matchData.events.splice(index, 1);
            renderEventsList();
        });
        
        eventsList.appendChild(eventItem);
    });
}

// 更新比分
function updateScore() {
    matchData.homeScore = parseInt(document.getElementById('home-score').value) || 0;
    matchData.awayScore = parseInt(document.getElementById('away-score').value) || 0;
}

// 更新比赛数据
function updateMatchData() {
    matchData.name = document.getElementById('match-name').value || '上海交通大学2025年新生杯';
    matchData.date = document.getElementById('match-date').value || '';
    matchData.type = document.getElementById('match-type').value || '';
    matchData.homeTeam = document.getElementById('home-team').value || '';
    matchData.awayTeam = document.getElementById('away-team').value || '';
    matchData.homeScore = parseInt(document.getElementById('home-score').value) || 0;
    matchData.awayScore = parseInt(document.getElementById('away-score').value) || 0;
    matchData.referees.main = document.getElementById('main-referee').value || '';
    matchData.referees.assistant1 = document.getElementById('assistant-referee1').value || '';
    matchData.referees.assistant2 = document.getElementById('assistant-referee2').value || '';
    matchData.referees.fourth = document.getElementById('fourth-official').value || '';
}

// 导出到Excel
function exportToExcel() {
    updateMatchData();
    
    // 验证必填数据
    if (!matchData.homeTeam || !matchData.awayTeam) {
        alert('请填写两队名称');
        return;
    }
    
    try {
        // 检查XLSX库是否加载
        if (!window.XLSX) {
            alert('XLSX库未加载，请刷新页面重试');
            return;
        }
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 创建工作表 - 使用简单可靠的方法
        const ws = createBasicWorksheet();
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, "比赛记录");
        
        // 导出文件 - 直接使用SheetJS的标准方法
        XLSX.writeFile(wb, `${matchData.homeTeam || '主队'}-${matchData.awayTeam || '客队'}_比赛记录.xlsx`);
        
        // 提示用户如何在Excel中添加边框
        alert('Excel文件导出成功！\n\n提示：在Excel中打开文件后，可以：\n1. 选择所有数据区域\n2. 点击"开始"选项卡中的"边框"按钮\n3. 选择"所有框线"快速添加边框');
    } catch (error) {
        console.error('导出Excel失败:', error);
        alert(`导出Excel失败: ${error.message}`);
    }
}

// 增强版的边框应用函数，使用更简单直接的方式设置边框
function applyBordersEnhanced(ws) {
    // 获取数据范围
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // 定义简单的边框样式
    const thinBorder = {
        style: 'thin',
        color: { rgb: "000000" }
    };
    
    // 为每个单元格添加边框
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
            
            // 确保单元格存在
            if (!ws[cellAddress]) {
                ws[cellAddress] = {v: '', t: 's'};
            }
            
            // 确保样式对象存在
            if (!ws[cellAddress].s) {
                ws[cellAddress].s = {};
            }
            
            // 设置边框 - 使用更简单的方式
            ws[cellAddress].s.border = {
                top: thinBorder,
                bottom: thinBorder,
                left: thinBorder,
                right: thinBorder
            };
            
            // 设置对齐方式
            ws[cellAddress].s.alignment = {
                horizontal: 'center',
                vertical: 'center'
            };
        }
    }
    
    // 设置列宽
    ws['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 }
    ];
    
    // 重要：设置工作表保护以确保样式不丢失
    ws['!protect'] = {};
}

// 专注于数据结构和导出可靠性的工作表创建函数
function createBasicWorksheet() {
    // 创建一个二维数组作为数据源，确保数据结构清晰
    const data = [
        // 标题行
        ['', '', matchData.name || '上海交通大学2025年新生杯', '', ''],
        
        // 比赛信息行
        ['比赛时间', matchData.date || '', '比赛性质', matchData.type || '', ''],
        
        // 比分行
        [matchData.homeTeam || '球队A', matchData.homeScore.toString(), '-', matchData.awayScore.toString(), matchData.awayTeam || '球队B'],
        
        // 事件标题
        ['', '', '事件', '', '']
    ];
    
    // 事件记录（最多15条）
    const sortedEvents = [...matchData.events].sort((a, b) => a.minute - b.minute);
    
    for (let i = 0; i < 15; i++) {
        if (i < sortedEvents.length) {
            const event = sortedEvents[i];
            let eventText = '';
            
            // 根据事件类型生成文本
            switch (event.type) {
                case 'goal': eventText = `⚽ ${event.minute}' 进球: ${event.player}`; break;
                case 'own-goal': eventText = `⚽ ${event.minute}' 乌龙球: ${event.player}`; break;
                case 'penalty-goal': eventText = `⚽ ${event.minute}' 点球进球: ${event.player}`; break;
                case 'penalty-miss': eventText = `❌ ${event.minute}' 点球不进: ${event.player}`; break;
                case 'yellow': eventText = `🟨 ${event.minute}' 黄牌: ${event.player}`; break;
                case 'straight-red': eventText = `🟥 ${event.minute}' 直红: ${event.player}`; break;
                case 'second-yellow': eventText = `🟨🟥 ${event.minute}' 两黄变一红: ${event.player}`; break;
                case 'substitution': eventText = `🔄 ${event.minute}' 换人: ${event.playerOut} ↓ ${event.playerIn} ↑`; break;
                default: eventText = '';
            }
            
            // 根据队伍放置事件文本
            if (event.team === 'home') {
                data.push([eventText, '', '', '', '']);
            } else {
                data.push(['', '', '', '', eventText]);
            }
        } else {
            // 填充空白行
            data.push(['', '', '', '', '']);
        }
    }
    
    // 首发阵容标题和内容
    data.push(['', '', '首发', '', '']);
    
    for (let i = 0; i < 11; i++) {
        const homePlayer = (i < matchData.homeLineup.length) 
            ? (matchData.homeLineup[i].isCaptain 
                ? `${matchData.homeLineup[i].number}. ${matchData.homeLineup[i].name} (C)`
                : `${matchData.homeLineup[i].number}. ${matchData.homeLineup[i].name}`)
            : '';
            
        const awayPlayer = (i < matchData.awayLineup.length) 
            ? (matchData.awayLineup[i].isCaptain 
                ? `${matchData.awayLineup[i].number}. ${matchData.awayLineup[i].name} (C)`
                : `${matchData.awayLineup[i].number}. ${matchData.awayLineup[i].name}`)
            : '';
            
        data.push([homePlayer, '', '', '', awayPlayer]);
    }
    
    // 替补阵容标题和内容
    data.push(['', '', '替补', '', '']);
    
    for (let i = 0; i < 9; i++) {
        const homePlayer = (i < matchData.homeSubstitutes.length) 
            ? (matchData.homeSubstitutes[i].isCaptain 
                ? `${matchData.homeSubstitutes[i].number}. ${matchData.homeSubstitutes[i].name} (C)`
                : `${matchData.homeSubstitutes[i].number}. ${matchData.homeSubstitutes[i].name}`)
            : '';
            
        const awayPlayer = (i < matchData.awaySubstitutes.length) 
            ? (matchData.awaySubstitutes[i].isCaptain 
                ? `${matchData.awaySubstitutes[i].number}. ${matchData.awaySubstitutes[i].name} (C)`
                : `${matchData.awaySubstitutes[i].number}. ${matchData.awaySubstitutes[i].name}`)
            : '';
            
        data.push([homePlayer, '', '', '', awayPlayer]);
    }
    
    // 裁判信息
    data.push(['主裁判', matchData.referees.main || '', '助理裁判', matchData.referees.assistant1 || '', matchData.referees.assistant2 || '']);
    data.push(['第四官员', matchData.referees.fourth || '', '', '', '']);
    
    // 使用SheetJS的标准方法创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 优化列宽设置
    ws['!cols'] = [
        { wch: 18 },  // 主队列 - 稍微宽一点以容纳更长的球员名
        { wch: 6 },   // 主队比分列
        { wch: 5 },   // 分隔符列
        { wch: 6 },   // 客队比分列
        { wch: 18 }   // 客队列 - 稍微宽一点以容纳更长的球员名
    ];
    
    return ws;
}

// 创建比赛数据工作表
function createMatchWorksheet() {
    // 创建工作表数据
    const data = [];
    
    // 标题行
    data.push(['', '', matchData.name || '上海交通大学2025年新生杯', '', '']);
    
    // 比赛信息行
    data.push(['比赛时间', matchData.date || '', '比赛性质', matchData.type || '']);
    
    // 比分行 - 添加实际比分
    data.push([matchData.homeTeam || '球队A', matchData.homeScore, '-', matchData.awayScore, matchData.awayTeam || '球队B']);
    
    // 事件标题行
    data.push(['', '', '事件', '', '']);
    
    // 事件记录区域 - 填充实际事件数据
    let eventRow = 0;
    
    // 先按照时间排序事件
    const sortedEvents = [...matchData.events].sort((a, b) => a.minute - b.minute);
    
    // 处理每个事件
    sortedEvents.forEach(event => {
        if (eventRow >= 15) return; // 限制在15行内
        
        let eventText = '';
        
        // 根据事件类型生成文本，使用用户提供的图标
        switch (event.type) {
            case 'goal':
                eventText = `⚽ ${event.minute}' 进球: ${event.player}`;
                break;
            case 'own-goal':
                eventText = `⚽ ${event.minute}' 乌龙球: ${event.player}`;
                break;
            case 'penalty-goal':
                eventText = `⚽ ${event.minute}' 点球进球: ${event.player}`;
                break;
            case 'penalty-miss':
                eventText = `❌ ${event.minute}' 点球不进: ${event.player}`;
                break;
            case 'yellow':
                eventText = `🟨 ${event.minute}' 黄牌: ${event.player}`;
                break;
            case 'straight-red':
                eventText = `🟥 ${event.minute}' 直红: ${event.player}`;
                break;
            case 'second-yellow':
                eventText = `🟨🟥 ${event.minute}' 两黄变一红: ${event.player}`;
                break;
            case 'substitution':
                eventText = `🔄 ${event.minute}' 换人: ${event.playerOut} ↓ ${event.playerIn} ↑`;
                break;
        }
        
        // 根据队伍添加到相应列
        if (event.team === 'home') {
            data.push([eventText, '', '', '', '']);
        } else {
            data.push(['', '', '', '', eventText]);
        }
        
        eventRow++;
    });
    
    // 填充剩余空白行
    for (let i = eventRow; i < 15; i++) {
        data.push(['', '', '', '', '']);
    }
    
    // 首发阵容标题行
    data.push(['', '', '首发', '', '']);
    
    // 首发阵容区域 - 分别处理主队和客队
    // 创建11行空白数据
    const lineupRows = Array(11).fill(null).map(() => ['', '', '', '', '']);
    
    // 添加主队首发
    matchData.homeLineup.forEach((player, index) => {
        if (index < 11) {
            const playerText = player.isCaptain 
                ? `${player.number}. ${player.name} (C)` 
                : `${player.number}. ${player.name}`;
            lineupRows[index][0] = playerText;
        }
    });
    
    // 添加客队首发
    matchData.awayLineup.forEach((player, index) => {
        if (index < 11) {
            const playerText = player.isCaptain 
                ? `${player.number}. ${player.name} (C)` 
                : `${player.number}. ${player.name}`;
            lineupRows[index][4] = playerText;
        }
    });
    
    // 将处理好的首发阵容行添加到数据中
    lineupRows.forEach(row => data.push(row));
    
    // 替补阵容标题行
    data.push(['', '', '替补', '', '']);
    
    // 替补阵容区域 - 分别处理主队和客队
    // 创建9行空白数据
    const subRows = Array(9).fill(null).map(() => ['', '', '', '', '']);
    
    // 添加主队替补
    matchData.homeSubstitutes.forEach((player, index) => {
        if (index < 9) {
            const playerText = player.isCaptain 
                ? `${player.number}. ${player.name} (C)` 
                : `${player.number}. ${player.name}`;
            subRows[index][0] = playerText;
        }
    });
    
    // 添加客队替补
    matchData.awaySubstitutes.forEach((player, index) => {
        if (index < 9) {
            const playerText = player.isCaptain 
                ? `${player.number}. ${player.name} (C)` 
                : `${player.number}. ${player.name}`;
            subRows[index][4] = playerText;
        }
    });
    
    // 将处理好的替补阵容行添加到数据中
    subRows.forEach(row => data.push(row));
    
    // 裁判信息
    data.push(['主裁判', matchData.referees.main || '', '助理裁判', matchData.referees.assistant1 || '', matchData.referees.assistant2 || '']);
    data.push(['第四官员', matchData.referees.fourth || '', '', '', '']);
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 设置列宽
    ws['!cols'] = [
        { wch: 15 }, // 列A
        { wch: 15 }, // 列B
        { wch: 10 }, // 列C
        { wch: 15 }, // 列D
        { wch: 15 }  // 列E
    ];
    
    // 添加边框样式
    applyBorders(ws);
    
    return ws;
}

// 应用边框样式到工作表 - 确保每个单元格都有明确的细线边框
function applyBorders(ws) {
    // 获取数据范围
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // 创建更粗的边框样式对象，确保在Excel中清晰可见
    const borderStyle = {
        style: 'thin', // 尝试使用'thin'而不是更细的样式
        color: { rgb: "000000" } // 明确使用黑色
    };
    
    // 为每个单元格添加边框，确保边框样式完全一致
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
            
            // 如果单元格不存在，创建一个
            if (!ws[cellAddress]) {
                ws[cellAddress] = {v: '', t: 's'};
            }
            
            // 确保样式对象存在
            if (!ws[cellAddress].s) {
                ws[cellAddress].s = {};
            }
            
            // 直接设置边框，确保不会有任何覆盖问题
            ws[cellAddress].s.border = {
                top: borderStyle,
                bottom: borderStyle,
                left: borderStyle,
                right: borderStyle
            };
            
            // 设置单元格对齐方式，使内容居中显示
            ws[cellAddress].s.alignment = {
                horizontal: 'center',
                vertical: 'center'
            };
        }
    }
    
    // 设置列宽，使表格更加美观
    ws['!cols'] = [
        { wch: 15 }, // A列宽度
        { wch: 12 }, // B列宽度
        { wch: 12 }, // C列宽度
        { wch: 12 }, // D列宽度
        { wch: 15 }  // E列宽度
    ];
    
    // 创建一个特殊的样式范围对象，用于确保边框被正确渲染
    // 这是一种额外的保险措施，确保整个表格区域有边框
    ws['!merges'] = ws['!merges'] || [];
}

// 初始化示例数据
function initSampleData() {
    // 设置示例数据
    document.getElementById('match-date').value = '2025-10-12';
    document.getElementById('match-type').value = '小组赛A组第一轮';
    document.getElementById('home-team').value = '医学院';
    document.getElementById('away-team').value = '致远';
    document.getElementById('home-score').value = '4';
    document.getElementById('away-score').value = '1';
    
    // 添加示例首发球员
    const homeLineup = [
        { number: 11, name: '缪乐荃', isCaptain: true },
        { number: 17, name: '张绍涵', isCaptain: false },
        { number: 18, name: '刘宇浩', isCaptain: false },
        { number: 14, name: '祁睿博', isCaptain: false },
        { number: 16, name: '张彬炫', isCaptain: false },
        { number: 4, name: '张行健', isCaptain: false },
        { number: 3, name: '马志祥', isCaptain: false },
        { number: 12, name: '王家祺 (GK)', isCaptain: false }
    ];
    
    const awayLineup = [
        { number: 1, name: '林函锋', isCaptain: false },
        { number: 6, name: '沈鼎越', isCaptain: false },
        { number: 7, name: '李卓睿', isCaptain: false },
        { number: 8, name: '许子谦', isCaptain: false },
        { number: 11, name: '金子墨', isCaptain: false },
        { number: 17, name: '陈子涵', isCaptain: false },
        { number: 19, name: '王西泽', isCaptain: true },
        { number: 21, name: '史聿宸', isCaptain: false }
    ];
    
    // 添加示例替补球员
    const homeSubstitutes = [
        { number: 13, name: '程昊君', isCaptain: false },
        { number: 15, name: '韦影孝', isCaptain: false },
        { number: 19, name: '张乔智', isCaptain: false },
        { number: 10, name: '邹子同', isCaptain: false },
        { number: 7, name: '张益华', isCaptain: false },
        { number: 9, name: '张家羽', isCaptain: false },
        { number: 21, name: '蔡博涵', isCaptain: false },
        { number: 2, name: '祁浩', isCaptain: false },
        { number: 5, name: '刘志轩', isCaptain: false }
    ];
    
    const awaySubstitutes = [
        { number: 4, name: '潘傲惟', isCaptain: false },
        { number: 5, name: '宋俊霆', isCaptain: false },
        { number: 10, name: '柯博宏', isCaptain: false },
        { number: 13, name: '王镜杰', isCaptain: false },
        { number: 14, name: '李昀埔', isCaptain: false },
        { number: 15, name: '赵也品', isCaptain: false },
        { number: 16, name: '万正尧', isCaptain: false },
        { number: 20, name: '夏从心', isCaptain: false },
        { number: 23, name: '', isCaptain: false }
    ];
    
    // 渲染示例球员
    renderSamplePlayers('home-lineup', homeLineup);
    renderSamplePlayers('away-lineup', awayLineup);
    renderSamplePlayers('home-substitutes', homeSubstitutes);
    renderSamplePlayers('away-substitutes', awaySubstitutes);
    
    // 设置裁判信息
    document.getElementById('main-referee').value = '王敬涵';
    document.getElementById('assistant-referee1').value = '刘信武';
    document.getElementById('assistant-referee2').value = '李文昊';
    document.getElementById('fourth-official').value = '扶宇征';
    
    // 添加示例事件（包含新的事件类型）
    matchData.events = [
        { minute: 2, team: 'home', type: 'goal', player: '张彬炫' },
        { minute: 8, team: 'home', type: 'penalty-goal', player: '张绍涵' },
        { minute: 15, team: 'away', type: 'own-goal', player: '万正尧' },
        { minute: 20, team: 'home', type: 'penalty-miss', player: '刘宇浩' },
        { minute: 24, team: 'away', type: 'yellow', player: '万正尧' },
        { minute: 25, team: 'away', type: 'yellow', player: '徐子谦' },
        { minute: 25, team: 'away', type: 'goal', player: '王西泽' },
        { minute: 30, team: 'home', type: 'straight-red', player: '马志祥' },
        { minute: 35, team: 'home', type: 'substitution', playerOut: '张家羽', playerIn: '刘志轩' },
        { minute: 35, team: 'away', type: 'substitution', playerOut: '夏从心', playerIn: '陈XX' },
        { minute: 45, team: 'away', type: 'second-yellow', player: '徐子谦' },
        { minute: 60, team: 'home', type: 'goal', player: '张绍涵' }
    ];
    
    renderEventsList();
    updatePlayerData();
    updateScore();
}

// 渲染示例球员
function renderSamplePlayers(containerId, players) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    players.forEach(player => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.innerHTML = `
            <input type="number" class="player-number" placeholder="号码" value="${player.number || ''}">
            <input type="text" class="player-name" placeholder="姓名" value="${player.name || ''}">
            <label class="captain-label">
                <input type="checkbox" class="captain-checkbox" ${player.isCaptain ? 'checked' : ''}> (C)
            </label>
            <button class="remove-btn">移除</button>
        `;
        
        // 添加移除按钮事件
        playerItem.querySelector('.remove-btn').addEventListener('click', () => {
            container.removeChild(playerItem);
            updatePlayerData();
        });
        
        // 添加输入事件监听
        playerItem.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', updatePlayerData);
        });
        
        container.appendChild(playerItem);
    });
}