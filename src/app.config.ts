export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/practice/index',
    'pages/mine/index',
    'pages/exercise/index',
    'pages/editor/index',
    'pages/result/index',
    'pages/example/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6B9D',
    navigationBarTitleText: '漫画嵌字练习',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#B2BEC3',
    selectedColor: '#FF6B9D',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/practice/index',
        text: '练习'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
