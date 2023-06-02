'use strict'

/* global chrome */

import * as i18n from './localize.js'
import * as storage from './storage.js'
import * as duration from './duration.js'

document.addEventListener('DOMContentLoaded', init)

async function init () {
  try {
    await renderLogs()
    await i18n.localize()
  } catch (error) {
    console.error('An error occurred:', error)
  }

  registerListeners()
  ready()
}

function ready () {
  document.body.classList.remove('hidden')
  document.title = chrome.i18n.getMessage('LOGS_TITLE')
}

async function renderLogs () {
  const logElement = document.getElementById('logs')

  const storedLogs = await storage.load('logs', []).catch((error) => {
    console.error('An error occurred:', error)
  })

  if ((storedLogs.length === 0) || (storedLogs.length === 1 && storedLogs[0].inProgress === true)) {
    const container = document.getElementById('container')
    container.innerHTML = ''

    const emptyEl = document.createElement('div')
    emptyEl.classList.add('empty')
    emptyEl.innerText = chrome.i18n.getMessage('NO_LOGS')

    container.appendChild(emptyEl)

    // Hide delete logs button
    const deleteLogsButton = document.getElementById('deleteLogs')
    deleteLogsButton.style.display = 'none'

    return
  }

  logElement.innerHTML = ''

  for (const logObj of storedLogs) {
    if (logObj.inProgress === true) continue

    const pathToPredefinedHtml = chrome.runtime.getURL('../html/log-item.html')

    const response = await fetch(pathToPredefinedHtml).catch((error) => {
      console.error('An error occurred:', error)
    })

    const html = await response.text().catch((error) => {
      console.error('An error occurred:', error)
    })

    const fragment = document.createRange().createContextualFragment(html)

    const formattedDateTime = formatDateTime(logObj.start)
    const sessionDuration = logObj.totalDuration
    const sessionActiveDuration = logObj.activeDuration
    const sessionIdleDuration = logObj.idleDuration

    const formattedSessionDuration = duration.getFormattedLong(sessionDuration)
    const formattedActiveDuration = duration.getFormattedLong(sessionActiveDuration)
    const formattedIdleDuration = duration.getFormattedLong(sessionIdleDuration)

    const sessionStartElement = fragment.querySelector('.session-start')
    sessionStartElement.innerText = formattedDateTime

    const activeTimeElement = fragment.querySelector('.active-duration')
    activeTimeElement.innerText = formattedActiveDuration

    const idleTimeElement = fragment.querySelector('.idle-duration')
    idleTimeElement.innerText = formattedIdleDuration

    const sessionTimeElement = fragment.querySelector('.session-duration')
    sessionTimeElement.innerText = formattedSessionDuration

    for (const log of logObj.log) {
      if (log.type === 'start') continue

      const div = document.createElement('div')
      const logTotalDuration = log.duration
      const formattedLogDuration = duration.getFormattedLong(logTotalDuration)
      const percentageDuration = (logTotalDuration / sessionDuration) * 100

      div.style.width = `${percentageDuration}%`
      div.classList.add(log.idle === true ? 'idle' : 'active')
      div.title = `${
        log.idle === true
          ? chrome.i18n.getMessage('IDLE')
          : chrome.i18n.getMessage('ACTIVE')
      }: ${formattedLogDuration}`

      fragment.querySelector('.visualization').appendChild(div)
    }

    logElement.appendChild(fragment)
  }
}

function formatDateTime (datetime) {
  const datetimeObject = new Date(datetime)
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  const formattedDate = datetimeObject.toLocaleDateString(undefined, options)

  return `${formattedDate}`
}

function registerListeners () {
  const on = (target, event, handler) => {
    if (typeof target === 'string') {
      document.getElementById(target).addEventListener(event, handler, false)
    } else {
      target.addEventListener(event, handler, false)
    }
  }

  on('actions', 'click', onActionClicked)
}

async function onActionClicked (e) {
  const target = e.target
  const targetId = target.id

  if (targetId === 'deleteLogs') {
    try {
      await deleteLogs()
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}

async function deleteLogs () {
  const storedLogs = await storage.load('logs', []).catch((error) => {
    console.error('An error occurred:', error)
  })

  if (storedLogs.length === 0 || (storedLogs.length === 1 && storedLogs[0].inProgress === true)) {
    return
  }

  if (window.confirm(chrome.i18n.getMessage('CONFIRM_DELETE_LOGS'))) {
    try {
      const remainingLogs = storedLogs.filter((log) => log.inProgress === true)
      await storage.save('logs', remainingLogs)
      await renderLogs()
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }
}
