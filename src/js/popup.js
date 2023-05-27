'use strict'

/* global chrome */

import * as i18n from './localize.js'
import * as navigation from './navigation.js'
import * as storage from './storage.js'
import * as message from './message.js'
import * as duration from './duration.js'
import * as tabs from './tabs.js'
import * as alarm from './alarms.js'

document.addEventListener('DOMContentLoaded', init)

async function init () {
  try {
    await i18n.localize()
    await updateControls()
    await restorePreferences()
  } catch (error) {
    console.error('An error occurred:', error)
  }

  navigation.init()
  registerListeners()
  ready()
}

async function ready () {
  postponeAnimationUntilReady()
}

function postponeAnimationUntilReady () {
  const animatedElements = document.querySelectorAll('.no-transition')

  for (const el of animatedElements) {
    const pseudoBefore = window.getComputedStyle(el, ':before').content
    const pseudoAfter = window.getComputedStyle(el, ':after').content
    const hasBeforeContent = pseudoBefore !== 'none' && pseudoBefore !== ''
    const hasAfterContent = pseudoAfter !== 'none' && pseudoAfter !== ''

    if (hasBeforeContent || hasAfterContent) {
      el.addEventListener(
        'transitionend',
        function () {
          el.classList.remove('no-transition')
        },
        { once: true }
      )
    }

    el.classList.remove('no-transition')
  }
}

function registerListeners () {
  const on = (target, event, handler) => {
    if (typeof target === 'string') {
      document.getElementById(target).addEventListener(event, handler, false)
    } else {
      target.addEventListener(event, handler, false)
    }
  }

  const onAll = (target, event, handler) => {
    const elements = document.querySelectorAll(target)

    for (const el of elements) {
      el.addEventListener(event, handler, false)
    }
  }

  on(document, 'keydown', onDocumentKeydown)
  onAll('div.nav-index', 'click', onActionClicked)
  onAll('input[type="checkbox"]', 'change', onCheckBoxChanged)
  onAll('button', 'click', onButtonClicked)

  chrome.storage.onChanged.addListener(onStorageChanged)
}

function onDocumentKeydown (e) {
  if (e.key === 'p' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
    document.getElementById('newSession').click()
  }
}

async function onActionClicked (e) {
  const target = e.target
  const targetId = target.id

  if (targetId === 'newSession') {
    try {
      await sessionStartEnd()
    } catch (error) {
      console.error('An error occurred:', error)
    }
    window.close()
  } else if (targetId === 'stats') {
    try {
      await openStats()
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}

async function openStats () {
  const statsPagePath = chrome.runtime.getURL('../html/stats.html')
  try {
    await tabs.create(statsPagePath)
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function sessionStartEnd () {
  const currentSession = await storage
    .load('currentSession', storage.sessionDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  try {
    await message.send(currentSession.enabled ? 'end-session' : 'new-session')
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function onCheckBoxChanged (e) {
  const target = e.target
  const targetId = target.id

  const storedPreferences = await storage
    .load('preferences', storage.preferenceDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
      target.checked = !target.checked
    })

  const preference = storedPreferences[targetId]

  if (!preference) return

  preference.status = target.checked

  try {
    await storage.save('preferences', storedPreferences)
  } catch (error) {
    console.error('An error occurred:', error)
    target.checked = !target.checked
  }
}

async function onButtonClicked (e) {
  const target = e.target
  const targetId = target.id

  if (targetId === 'buttonControl') {
    try {
      await togglePauseResumeSession()
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}

async function togglePauseResumeSession () {
  const currentAlarm = await alarm.get('timer').catch((error) => {
    console.error('An error occurred:', error)
  })

  try {
    if (currentAlarm) {
      await message.send('pause-session')
      updateControlButton(false)
    } else {
      await message.send('resume-session')
      updateControlButton(true)
    }
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function onStorageChanged (changes) {
  if (changes.currentSession && changes.currentSession.newValue) {
    const session = changes.currentSession.newValue
    updateDurationItem(session.duration)
  }
}

async function updateControls () {
  const currentSession = await storage
    .load('currentSession', storage.sessionDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  try {
    await updateDurationItem(currentSession.duration)
    await updateSessionRowLabel(currentSession)
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function restorePreferences () {
  const storedPreferences = await storage
    .load('preferences', storage.preferenceDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  for (const preferenceName in storedPreferences) {
    const preferenceObj = storedPreferences[preferenceName]
    const preferenceElement = document.getElementById(preferenceName)

    if (preferenceElement) {
      preferenceElement.checked = preferenceObj.status
    }
  }
}

async function updateDurationItem (sessionDuration) {
  const durationEl = document.getElementById('durationDisplay')

  if (durationEl) {
    const formattedDuration = duration.getFormattedLong(sessionDuration)
    durationEl.innerText = formattedDuration
  }
}

async function updateSessionRowLabel (currentSession) {
  if (currentSession.enabled) {
    const restartLabel = document.querySelector("[data-localize='NEW']")
    restartLabel.innerText = chrome.i18n.getMessage('END')

    const restartIcon = document.querySelector('.restart')
    restartIcon.classList.remove('restart')
    restartIcon.classList.add('cancel')

    updatePauseResumeButtonLabel(currentSession.enabled)
  } else {
    document.getElementById('currentSession').remove()
  }
}

async function updatePauseResumeButtonLabel (sessionEnabled) {
  const currentAlarm = await alarm.get('timer').catch((error) => {
    console.error('An error occurred:', error)
  })

  if (sessionEnabled && !currentAlarm) {
    updateControlButton(false)
  }
}

async function updateControlButton (hasAlarm) {
  const buttonEl = document.getElementById('buttonControl')
  const statusEl = document.getElementById('statusDetail')

  if (buttonEl) {
    buttonEl.innerText = hasAlarm
      ? chrome.i18n.getMessage('PAUSE')
      : chrome.i18n.getMessage('RESUME')
  }

  if (statusEl) {
    statusEl.innerText = hasAlarm ? '' : chrome.i18n.getMessage('PAUSED')
  }
}
