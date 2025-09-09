import React from "react"
import asanaPng from '../assets/asana.png'
import slackPng from '../assets/slack.png'
import GithubPng from '../assets/github.png'
// import AirtablePng from '../assets/airtable.png'
// import AmplitudePng from '../assets/amplitude.png'
import dropBoxPng from "../assets/dropbox.png"
import confluencePng from '../assets/confluence.png'
import gCalendarPng from '../assets/gCalendar.png'

export function getToolIcon(connectorName: string): React.ReactElement {
  console.log(connectorName)

  switch (connectorName) {
    case 'asana':
      return <img src={asanaPng} alt="Asana" className="w-5 h-5" />
    case 'slack':
      return <img src={slackPng} alt="Slack" className="w-5 h-5" />
    case 'googleCalendar':
      return <img src={gCalendarPng} alt="Google Calendar" className="w-5 h-5" />
    case 'confluence':
      return <img src={confluencePng} alt="Google Calendar" className="w-5 h-5" />
    case 'github':
      return <img src={GithubPng} alt="Google Calendar" className="w-5 h-5" />
    case 'dropbox':
      return <img src={dropBoxPng} alt="Google Calendar" className="w-5 h-5" />
    default:
      return <img src={slackPng} alt="Default" className="w-5 h-5" />
  }
} 