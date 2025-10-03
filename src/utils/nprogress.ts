import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({
  easing: 'ease',
  speed: 300,
  showSpinner: false,
  minimum: 0.3,
  parent: 'body',
})

export default NProgress
