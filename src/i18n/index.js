// i18n configuration and language management
import { reactive, computed } from 'vue';

// Language state management
export const i18nState = reactive({
  currentLanguage: 'en', // Default to English
  languages: {
    'en': { name: 'English', code: 'en' },
    'zh-cn': { name: '简体中文', code: 'zh-cn' },
    'zh-tw': { name: '繁體中文', code: 'zh-tw' },
  }
});

// Empty language packs
const languagePacks = {
  'en': {
    // Basic wallet UI keys retained as placeholders
    'header.connectWallet': 'Connect Wallet',
    'wallet.connectTitle': 'Connect Wallet',
    'wallet.connectSubtitle': 'Select a wallet',
    'wallet.connectedTitle': 'Connected',
    'wallet.address': 'Address',
    'wallet.network': 'Network',
    'wallet.disconnect': 'Disconnect',
    'wallet.noWalletDetected': 'No wallet detected',
    'home.stakingAreaTitle': 'Staking Area',
    'home.stakingAreaDesc': 'Stake your tokens here to earn rewards...',
    'home.heroSubtitleSecondary': 'Leverage decentralization advantages with Bitcoin Stamps inscription.',
    'home.bind': 'My Referral',
    'home.info': 'My Friends',
    'home.ordersTitle': 'Orders',
    'home.noData': 'No data yet...',
    'bind.modalTitle': 'Bind Referral',
    'bind.myReferrer': 'My Referrer',
    'bind.bindReferrerDesc': 'Enter a referrer address to bind. This action cannot be changed later.',
    'bind.bindSuccessDesc': 'Referrer address has been bound successfully.',
    'bind.referrerPlaceholder': '0x...',
    'bind.binding': 'Binding...',
    'bind.bound': 'Bound',
    'bind.bind': 'Bind',
    'bind.connectWalletHint': 'Please connect wallet before binding.',
    'bind.referrerNotEligible': 'Current referrer address is not eligible. Please try another one.',
    'bind.myReferralLink': 'My Referral Link',
    'bind.referralLinkDesc': 'Share this link with your friends. They can build referral relation with you through this link.',
    'bind.referralLinkLockedDesc': 'Bind your referrer address first to view and copy your own referral link.',
    'bind.copy': 'Copy',
    'bind.copyHint': 'Please check whether the ending address is your address when copying.',
    'bind.copyHintLocked': 'After binding, the full referral link will be shown here.',
    'friends.modalTitle': 'My Friends',
    'friends.myStatsTitle': 'My Stats',
    'friends.friendsCount': 'Friends',
    'friends.validFriendsCount': 'Valid Friends',
    'friends.myStake': 'My Stake',
    'friends.teamCount': 'Team Members',
    'friends.teamPerformance': 'Team Performance',
    'friends.listTitle': 'Friends List',
    'friends.friendStake': 'Friend Stake',
    'friends.peopleUnit': 'people',
    'bind.connectWalletFirst': 'Please connect wallet first',
    'bind.linkLocked': 'Available after binding referrer',
    'bind.confirm.title': 'Confirm Bind',
    'bind.confirm.desc': 'Binding cannot be changed later. Please confirm referrer address:',
    'bind.confirm.cancel': 'Cancel',
    'bind.confirm.confirm': 'Confirm',
    'bind.confirm.confirmWithCountdown': 'Confirm ({seconds}s)',
    'toast.bind.connectWalletFirst': 'Please connect wallet first',
    'toast.bind.invalidAddress': 'Invalid referrer address',
    'toast.bind.selfBind': 'You cannot bind yourself',
    'toast.bind.referrerNotEligible': 'Referrer is not eligible',
    'toast.bind.contractUnavailable': 'Referral contract unavailable',
    'toast.bind.txSubmitted': 'Transaction submitted',
    'toast.bind.bindSuccess': 'Referral bound successfully',
    'toast.bind.txCancelled': 'Transaction cancelled',
    'toast.bind.bindFailed': 'Bind failed, please check network',
    'toast.bind.copySuccess': 'Copied successfully',
    'toast.bind.copyFailed': 'Copy failed',
    'footer.intro': 'SKE is a homogeneous inscription token deployed and publicly minted using the Bitcoin Stamps protocol under the SRC-20 standard, a form of Bitcoin inscription.',
  },
  'zh-cn': {
     'header.connectWallet': '连接钱包',
     'wallet.connectTitle': '连接钱包',
     'wallet.connectSubtitle': '请选择钱包',
     'wallet.connectedTitle': '已连接',
     'wallet.address': '地址',
     'wallet.network': '网络',
     'wallet.disconnect': '断开连接',
     'wallet.noWalletDetected': '未检测到钱包',
     'home.stakingAreaTitle': '用户质押区域',
     'home.stakingAreaDesc': '在此质押您的代币以获取收益...',
     'home.heroSubtitleSecondary': '比特邮票铸造去中心化链上优势',
     'home.bind': '我的推荐',
     'home.info': '我的好友',
     'home.ordersTitle': '订单列表',
     'home.noData': '暂无数据...',
     'bind.modalTitle': '绑定好友',
     'bind.myReferrer': '我的推荐人',
     'bind.bindReferrerDesc': '输入推荐人地址后进行绑定，绑定后不可修改。',
     'bind.bindSuccessDesc': '已成功绑定推荐人地址。',
     'bind.referrerPlaceholder': '0x...',
     'bind.binding': '绑定中...',
     'bind.bound': '已绑定',
     'bind.bind': '绑定',
     'bind.connectWalletHint': '请先连接钱包后再进行绑定。',
     'bind.referrerNotEligible': '当前推荐人地址不可绑定，请核对。',
     'bind.myReferralLink': '我的推荐链接',
     'bind.referralLinkDesc': '将该链接分享给好友，好友可通过该链接与你建立推荐关系。',
     'bind.referralLinkLockedDesc': '绑定推荐人地址后可查看并复制自己的推荐链接。',
     'bind.copy': '复制',
     'bind.copyHint': '复制时请检查末尾地址是否为您的地址。',
     'bind.copyHintLocked': '完成绑定后，此处将展示完整推荐链接。',
     'friends.modalTitle': '我的好友',
     'friends.myStatsTitle': '我的资讯',
     'friends.friendsCount': '好友人数',
     'friends.validFriendsCount': '有效好友人数',
     'friends.myStake': '我的质押',
     'friends.teamCount': '组队人数',
     'friends.teamPerformance': '组队成果',
     'friends.listTitle': '好友列表',
     'friends.friendStake': '好友质押',
     'friends.peopleUnit': '人',
     'bind.connectWalletFirst': '请先连接钱包',
     'bind.linkLocked': '绑定推荐人地址后可用',
     'bind.confirm.title': '确认绑定',
     'bind.confirm.desc': '绑定后不可修改，请确认推荐人地址：',
     'bind.confirm.cancel': '取消',
     'bind.confirm.confirm': '确认',
     'bind.confirm.confirmWithCountdown': '确认 ({seconds}s)',
     'toast.bind.connectWalletFirst': '请先连接钱包',
     'toast.bind.invalidAddress': '推荐人地址格式错误',
     'toast.bind.selfBind': '不能绑定自己为推荐人',
     'toast.bind.referrerNotEligible': '当前推荐人地址不可绑定，请核对。',
     'toast.bind.contractUnavailable': '推荐合约不可用',
     'toast.bind.txSubmitted': '交易已提交',
     'toast.bind.bindSuccess': '绑定推荐人成功',
     'toast.bind.txCancelled': '已取消交易',
     'toast.bind.bindFailed': '绑定失败，请检查网络后重试',
     'toast.bind.copySuccess': '复制成功',
     'toast.bind.copyFailed': '复制失败',
     'footer.intro': 'SKE 是一种同质化铭文代币，基于 SRC-20 标准，通过 Bitcoin Stamps 协议部署并公开铸造，属于比特币铭文的一种形式。',
  },
  'zh-tw': {
     'header.connectWallet': '連接錢包',
     'wallet.connectTitle': '連接錢包',
     'wallet.connectSubtitle': '請選擇錢包',
     'wallet.connectedTitle': '已連接',
     'wallet.address': '地址',
     'wallet.network': '網絡',
     'wallet.disconnect': '斷開連接',
     'wallet.noWalletDetected': '未檢測到錢包',
     'home.stakingAreaTitle': '用戶質押區域',
     'home.stakingAreaDesc': '在此質押您的代幣以獲取收益...',
     'home.heroSubtitleSecondary': '比特郵票鑄造去中心化鏈上優勢',
     'home.bind': '我的推薦',
     'home.info': '我的好友',
     'home.ordersTitle': '訂單列表',
     'home.noData': '暫無數據...',
     'bind.modalTitle': '綁定好友',
     'bind.myReferrer': '我的推薦人',
     'bind.bindReferrerDesc': '輸入推薦人地址後進行綁定，綁定後不可修改。',
     'bind.bindSuccessDesc': '已成功綁定推薦人地址。',
     'bind.referrerPlaceholder': '0x...',
     'bind.binding': '綁定中...',
     'bind.bound': '已綁定',
     'bind.bind': '綁定',
     'bind.connectWalletHint': '請先連接錢包後再進行綁定。',
     'bind.referrerNotEligible': '當前推薦人地址暫不可綁定，請更換後重試。',
     'bind.myReferralLink': '我的推薦鏈接',
     'bind.referralLinkDesc': '將該鏈接分享給好友，好友可通過該鏈接與你建立推薦關係。',
     'bind.referralLinkLockedDesc': '綁定推薦人地址後可查看並複製自己的推薦鏈接。',
     'bind.copy': '複製',
     'bind.copyHint': '複製時請檢查末尾地址是否為您的地址。',
     'bind.copyHintLocked': '完成綁定後，此處將展示完整推薦鏈接。',
     'friends.modalTitle': '我的好友',
     'friends.myStatsTitle': '我的資訊',
     'friends.friendsCount': '好友人數',
     'friends.validFriendsCount': '有效好友人數',
     'friends.myStake': '我的質押',
     'friends.teamCount': '組隊人數',
     'friends.teamPerformance': '組隊成果',
     'friends.listTitle': '好友列表',
     'friends.friendStake': '好友質押',
     'friends.peopleUnit': '人',
     'bind.connectWalletFirst': '請先連接錢包',
     'bind.linkLocked': '綁定推薦人地址後可用',
     'bind.confirm.title': '確認綁定',
     'bind.confirm.desc': '綁定後不可修改，請確認推薦人地址：',
     'bind.confirm.cancel': '取消',
     'bind.confirm.confirm': '確認',
     'bind.confirm.confirmWithCountdown': '確認 ({seconds}s)',
     'toast.bind.connectWalletFirst': '請先連接錢包',
     'toast.bind.invalidAddress': '推薦人地址格式錯誤',
     'toast.bind.selfBind': '不能綁定自己為推薦人',
     'toast.bind.referrerNotEligible': '當前推薦人不可綁定',
     'toast.bind.contractUnavailable': '推薦合約不可用',
     'toast.bind.txSubmitted': '交易已提交',
     'toast.bind.bindSuccess': '綁定推薦人成功',
     'toast.bind.txCancelled': '已取消交易',
     'toast.bind.bindFailed': '綁定失敗，請檢查網絡後重試',
     'toast.bind.copySuccess': '複製成功',
     'toast.bind.copyFailed': '複製失敗',
     'footer.intro': 'SKE 是一種同質化銘文代幣，基於 SRC-20 標準，透過 Bitcoin Stamps 協議部署並公開鑄造，屬於比特幣銘文的一種形式。',
  }
};

// Translation function
export function t(key, params = {}) {
  const currentPack = languagePacks[i18nState.currentLanguage];
  if (!currentPack) return key;
  
  let translation = currentPack[key];
  if (translation === undefined) return key;
  
  Object.keys(params).forEach(param => {
    translation = translation.replace(`{${param}}`, params[param]);
  });
  
  return translation;
}

export function setLanguage(languageCode) {
  if (i18nState.languages[languageCode]) {
    i18nState.currentLanguage = languageCode;
    localStorage.setItem('pgnlz_language', languageCode);
    window.location.reload();
  }
}

export function initializeLanguage() {
  const savedLanguage = localStorage.getItem('pgnlz_language');
  if (savedLanguage && i18nState.languages[savedLanguage]) {
    i18nState.currentLanguage = savedLanguage;
  }
}

export const currentLanguage = computed(() => i18nState.currentLanguage);
export const availableLanguages = computed(() => Object.values(i18nState.languages));
