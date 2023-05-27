'use strict'

/* global chrome */

import * as storage from './js/storage.js'
import * as alarm from './js/alarms.js'
import * as duration from './js/duration.js'
import * as action from './js/action.js'
import * as offscreen from './js/offscreen.js'
import * as message from './js/message.js'

chrome.idle.setDetectionInterval(60)

chrome.idle.onStateChanged.addListener(onIdleStateChanged)
chrome.alarms.onAlarm.addListener(onAlarmTick)
chrome.runtime.onMessage.addListener(onMessageReceived)
chrome.commands.onCommand.addListener(onCommandReceived)
chrome.runtime.onStartup.addListener(init)
chrome.runtime.onInstalled.addListener(init)

async function init () {
  try {
    await setInitialDuration()
    await activateOnStartup()
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function activateOnStartup () {
  const storedPreferences = await storage
    .load('preferences', storage.preferenceDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  if (storedPreferences.activateOnStartup.status === true) {
    const currentSession = await storage
      .load('currentSession', storage.sessionDefaults)
      .catch((error) => {
        console.error('An error occurred:', error)
      })

    try {
      if (!currentSession.enabled) {
        await newSession()
      } else {
        await endSession(false)
        await newSession()
      }
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}

async function setInitialDuration () {
  const currentSession = await storage
    .load('currentSession', storage.sessionDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  const formattedDurationShort = duration.getFormattedShort(
    currentSession.duration
  )
  const formattedDurationLong = duration.getFormattedLong(
    currentSession.duration
  )

  if (!currentSession.enabled) return

  try {
    await Promise.all([
      action.updateBadgeText(formattedDurationShort),
      action.updateActionTitle(formattedDurationLong)
    ])
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function newSession () {
  const newSession = storage.sessionDefaults
  newSession.enabled = true

  try {
    await storage.save('currentSession', newSession)
    await alarm.create('timer', 1, 1)
    await setInitialDuration()
  } catch (error) {
    console.error('An error occurred:', error)
  }

  playSound('new')

  try {
    await createLogEntry()
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function endSession (shouldPlaySound) {
  try {
    await storage.clear('currentSession')
    await alarm.clear('timer')
  } catch (error) {
    console.error('An error occurred:', error)
  }

  if (shouldPlaySound !== false) playSound('pause')

  try {
    await Promise.all([
      action.updateBadgeText(''),
      action.updateActionTitle(''),
      finalizeLogEntry()
    ])
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function onIdleStateChanged (state) {
  const currentAlarm = await alarm.get('timer').catch((error) => {
    console.error('An error occurred:', error)
  })

  if (currentAlarm) {
    try {
      switch (state) {
        case 'locked':
        case 'idle':
          await storage.saveSession('status', 'idle')
          break
        case 'active':
          await storage.saveSession('status', 'enabled')
          break
      }
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}

async function onAlarmTick (alarm) {
  if (alarm.name === 'timer') {
    const status = await storage
      .loadSession('status', 'enabled')
      .catch((error) => {
        console.error('An error occurred:', error)
      })

    const storedLogs = await storage.load('logs', []).catch((error) => {
      console.error('An error occurred:', error)
    })

    if (storedLogs.length === 0) {
      const newLog = {
        totalDuration: 0,
        activeDuration: 0,
        idleDuration: 0,
        inProgress: true,
        start: new Date().toISOString(),
        log: [
          {
            type: 'start'
          }
        ]
      }

      storedLogs.unshift(newLog)
    }

    const currentObj = storedLogs[0]
    const currentLog = currentObj.log
    const previousLogItem = currentLog[currentLog.length - 1]

    if (status === 'enabled') {
      incrementDuration()

      if (
        previousLogItem.type === 'increment' &&
        previousLogItem.idle === false
      ) {
        previousLogItem.duration++
      } else {
        const newLogItem = { type: 'increment', duration: 1, idle: false }
        currentLog.push(newLogItem)
      }

      currentObj.activeDuration++
    } else {
      if (
        previousLogItem.type === 'increment' &&
        previousLogItem.idle === true
      ) {
        previousLogItem.duration++
      } else {
        const newLogItem = { type: 'increment', duration: 1, idle: true }
        currentLog.push(newLogItem)
      }

      currentObj.idleDuration++
    }

    currentObj.totalDuration++

    try {
      await storage.save('logs', storedLogs)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}

async function incrementDuration () {
  const currentSession = await storage
    .load('currentSession', storage.sessionDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  currentSession.duration++

  const formattedDurationShort = duration.getFormattedShort(
    currentSession.duration
  )
  const formattedDurationLong = duration.getFormattedLong(
    currentSession.duration
  )

  try {
    await Promise.all([
      storage.save('currentSession', currentSession),
      action.updateBadgeText(formattedDurationShort),
      action.updateActionTitle(formattedDurationLong)
    ])
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function onMessageReceived (message, sender, sendResponse) {
  sendResponse()

  try {
    switch (message) {
      case 'new-session':
        await newSession()
        break
      case 'end-session':
        await endSession()
        break
      case 'pause-session':
        await pauseSession()
        break
      case 'resume-session':
        await resumeSession()
        break
    }
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function pauseSession () {
  try {
    await alarm.clear('timer')
  } catch (error) {
    console.error('An error occurred:', error)
  }

  playSound('pause')
}

async function resumeSession () {
  try {
    await alarm.create('timer', 1, 1)
  } catch (error) {
    console.error('An error occurred:', error)
  }

  playSound('resume')
}

const playSound = throttle(sendSoundToOffscreenDocument, 100)

async function sendSoundToOffscreenDocument (sound) {
  const storedPreferences = await storage
    .load('preferences', storage.preferenceDefaults)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  if (storedPreferences.sounds.status === false) return

  const documentPath = 'audio-player.html'
  const hasDocument = await offscreen
    .hasDocument(documentPath)
    .catch((error) => {
      console.error('An error occurred:', error)
    })

  if (!hasDocument) {
    try {
      await offscreen.create(documentPath)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }

  try {
    await message.send({ msg: 'play_sound', sound })
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

function throttle (func, delay) {
  let lastExecTime = 0
  return function () {
    const context = this
    const args = arguments
    const now = Date.now()
    if (now - lastExecTime >= delay) {
      lastExecTime = now
      func.apply(context, args)
    }
  }
}

async function createLogEntry () {
  const maxLogs = 100

  let storedLogs = await storage.load('logs', []).catch((error) => {
    console.error('An error occurred:', error)
  })

  // Remove empty logs
  storedLogs = storedLogs.filter(item => item.log.length !== 1)

  if (storedLogs.length >= maxLogs) {
    storedLogs.pop() // Remove the last log entry if the maximum limit is reached
  }

  const newLog = {
    totalDuration: 0,
    activeDuration: 0,
    idleDuration: 0,
    inProgress: true,
    start: new Date().toISOString(),
    log: [
      {
        type: 'start'
      }
    ]
  }

  storedLogs.unshift(newLog)

  try {
    await storage.save('logs', storedLogs)
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function finalizeLogEntry () {
  let storedLogs = await storage.load('logs', []).catch((error) => {
    console.error('An error occurred:', error)
  })

  const currentLog = storedLogs[0]

  currentLog.inProgress = false

  // Remove empty logs
  storedLogs = storedLogs.filter(item => item.log.length !== 1)

  try {
    await storage.save('logs', storedLogs)
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

async function onCommandReceived (command) {
  if (command === 'toggleOnOff') {
    const currentSession = await storage
      .load('currentSession', storage.sessionDefaults)
      .catch((error) => {
        console.error('An error occurred:', error)
      })

    if (currentSession.enabled) {
      newSession()
    } else {
      endSession()
    }
  }
}
