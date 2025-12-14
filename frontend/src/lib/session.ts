import { v4 as uuid } from 'uuid'

const KEY = 'sabhyatam_session_id'

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem(KEY)
  if (!sid) {
    sid = uuid()
    localStorage.setItem(KEY, sid)
  }
  return sid
}
