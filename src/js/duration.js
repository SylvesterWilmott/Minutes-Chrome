'use strict'

/* global chrome */

export function getFormattedShort (duration) {
  const formatted = []
  const days = Math.floor(duration / 1440) // Number of minutes in a day
  const hours = Math.floor((duration % 1440) / 60)
  const minutes = duration % 60
  let daysStr
  let hoursStr
  let minutesStr

  if (duration === 0) {
    return duration.toString() + chrome.i18n.getMessage('MINUTES_SHORT')
  }

  if (days > 0) {
    daysStr = days.toString() + chrome.i18n.getMessage('DAYS_SHORT')
  }

  if (hours > 0) {
    hoursStr = hours.toString() + chrome.i18n.getMessage('HOURS_SHORT')
  }

  if (minutes > 0 && days === 0) {
    minutesStr = minutes.toString() + chrome.i18n.getMessage('MINUTES_SHORT')
  }

  if (daysStr) {
    formatted.push(daysStr)
  }

  if (hoursStr) {
    formatted.push(hoursStr)
  }

  if (minutesStr) {
    formatted.push(minutesStr)
  }

  return formatted.join('')
}

export function getFormattedLong (duration) {
  const formatted = []
  const days = Math.floor(duration / 1440) // Number of minutes in a day
  const hours = Math.floor((duration % 1440) / 60)
  const minutes = duration % 60
  let daysStr
  let hoursStr
  let minutesStr

  if (duration === 0) {
    return duration.toString() + ' ' + chrome.i18n.getMessage('MINUTES_LONG')
  }

  if (days > 0) {
    if (days === 1) {
      daysStr = days.toString() + ' ' + chrome.i18n.getMessage('DAYS_LONG_SINGULAR')
    } else {
      daysStr = days.toString() + ' ' + chrome.i18n.getMessage('DAYS_LONG')
    }
  }

  if (hours > 0) {
    if (hours === 1) {
      hoursStr = hours.toString() + ' ' + chrome.i18n.getMessage('HOURS_LONG_SINGULAR')
    } else {
      hoursStr = hours.toString() + ' ' + chrome.i18n.getMessage('HOURS_LONG')
    }
  }

  if (minutes > 0) {
    if (minutes === 1) {
      minutesStr = minutes.toString() + ' ' + chrome.i18n.getMessage('MINUTES_LONG_SINGULAR')
    } else {
      minutesStr = minutes.toString() + ' ' + chrome.i18n.getMessage('MINUTES_LONG')
    }
  }

  if (daysStr) {
    formatted.push(daysStr)
  }

  if (hoursStr) {
    formatted.push(hoursStr)
  }

  if (minutesStr) {
    formatted.push(minutesStr)
  }

  return formatted.join(', ')
}
