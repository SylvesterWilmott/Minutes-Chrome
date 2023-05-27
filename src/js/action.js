'use strict'

/* global chrome */

export function updateBadgeText (text) {
  return new Promise((resolve, reject) => {
    chrome.action.setBadgeText(
      {
        text
      },
      function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        resolve()
      }
    )
  })
}

export function updateActionTitle (title) {
  return new Promise((resolve, reject) => {
    chrome.action.setTitle(
      {
        title
      },
      function () {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
        }
        resolve()
      }
    )
  })
}
