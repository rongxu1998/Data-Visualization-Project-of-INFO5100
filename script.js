/**
 * JavaScript code for visualizing the NBA shot data
 * 
 * Authors: Jack Dauber (jd733), Jude Javillo (jij8), Jieyu Chen (jc3562), Rong Xu (rx25)
 * Date: 9 November 2021
 */

// CONSTANTS *******************************************************************

// A list of NBA teams' abbreviations
const teams = [
  "ATL", "BRK", "BOS", "CHO", "CHI", "CLE", "DAL", "DEN", "DET", "GSW",
  "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK",
  "OKC", "ORL", "PHI", "PHO", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"
]

// A list of NBA team's names
const names = [
  "Atlanta Hawks", "Brooklyn Nets", "Boston Celtics", "Charlotte Hornets",
  "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets",
  "Detroit Pistons", "Golden State Warriors", "Houston Rockets",
  "Indiana Pacers", "L.A. Clippers", "L.A. Lakers", "Memphis Grizzlies",
  "Miami Heat", "Milwaulkee Bucks", "Minnesota Timberwolves",
  "New Orleans Pelicans", "New York Knicks", "Oklahoma City Thunder",
  "Orlando Magic", "Philadelphia 76ers", "Phoenix Suns",
  "Portland Trailblazers", "Sacramento Kings", "San Antonio Spurs",
  "Toronto Raptors", "Utah Jazz", "Washington Wizards"
]

// A list of NBA seasons (seasons are denoted by ending year)
const years = [2015, 2016, 2017, 2018]

// A mapping from season to list of NBA players' stats
const stats = {}

// A mapping from season to NBA team to shots taken
const shots = {}

// The indicies of players on a team
const players = [
  0, 1, 2, 3, 4,
  5, 6, 7, 8, 9,
  10, 11, 12, 13, 14,
  15, 16, 17, 18, 19
]

// The maximum number of shots to display in the shot chart
const maxShots = 4000

// A mapping from season to league average % of 3PT shots taken 
const average = {}

// PROPERTIES ******************************************************************

// The constants for the container svg
const containerProps = {
  margin: "auto",
  width: 1400,
  height: 800
}

// The constants for the menu chart
const menuProps = {
  top: 0,
  left: 0,
  width: containerProps.width,
  height: 100
}

// The constants for the team chart
const teamProps = {
  standard: 0.1,
  larger: 0.4,
  spacing: 15,
  button: 77,
  corner: 15,
  width: 77,
  height: 199,
  left: 0,
  top: menuProps.height
}

// The constants for the year chart
const yearProps = {
  standard: 0.1,
  larger: 0.4,
  spacing: 15,
  button: 77,
  corner: 15,
  width: 331.25,
  height: 107,
  left: 0,
  top: menuProps.height
}

// The constants for the player chart
const playerProps = {
  standard: 0.1,
  larger: 0.4,
  spacing: 15,
  button: 77,
  corner: 15,
  width: 262,
  height: 383,
  left: 0,
  top: menuProps.height
}

// The constants for the stat chart
const statProps = {
  top: 200,
  left: 50,
  width: 600,
  height: 500,
  spacing: 5,
  bar: 20
}

// The constants for the shot chart
const shotProps = {
  top: 200,
  left: 750,
  width: 600,
  height: 500
}

// Some colors to choose from
const color = {
  league: "#5836FF",
  team: "#20EAC4",
  player: "#1F9800",
  make: "#C9082A",
  miss: "#006BB6"
}

// STATE VARIABLES *************************************************************

var showTeams = false
var showYears = false
var showPlayers = false

var selectedTeam = null
var selectedYear = null
var selectedPlayer = null

var roster = []
var statScale = null

// ELEMENTS ********************************************************************

const body = d3.select("body")

// The container div to center the visualization
const div = body.append("div")
  .style("margin", containerProps.margin)
  .style("width", containerProps.width)
  .attr("height", containerProps.height)

// The container svg to hold all elements of the visualization
const svg = div.append("svg")
  .attr("width", containerProps.width)
  .attr("height", containerProps.height)

// The container for the stat chart
const statChart = svg.append("g")
  .attr("transform", `translate(${statProps.left}, ${statProps.top})`)
  .attr("width", statProps.width)
  .attr("height", statProps.height)

// The title for the stat chart
const statTitle = svg.append("text")
  .text("Percentage of Shot Attempts From Behind The 3-Point Line")
  .attr("x", statProps.left + statProps.width / 2)
  .attr("y", statProps.top - 25)
  .attr("id", "shotTitle")
  .style("fill", "black")
  .attr("font-size", 20)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("dominant-baseline", "middle")

// The container for the shot chart
const shotChart = svg.append("g")
  .attr("transform", `translate(${shotProps.left}, ${shotProps.top})`)
  .attr("width", shotProps.width)
  .attr("height", shotProps.height)

// The container for the shot chart points
const shotPoints = shotChart.append("g")
  .attr("width", shotProps.width)
  .attr("height", shotProps.height)

// The container for the shot chart lines
const shotLines = shotChart.append("g")
  .attr("width", shotProps.width)
  .attr("height", shotProps.height)

// The title for the shot chart
const shotTitle = svg.append("text")
  .text("Select Team and Season to Visualize Shots Attempted")
  .attr("x", shotProps.left + shotProps.width / 2)
  .attr("y", shotProps.top - 25)
  .attr("id", "shotTitle")
  .style("fill", "black")
  .attr("font-size", 20)
  .attr("font-weight", "bold")
  .attr("text-anchor", "middle")
  .attr("dominant-baseline", "middle")

// The team chart group element
const teamChart = svg.append("g")
  .attr("id", "teamChart")
  .attr("transform", `translate(${teamProps.left},${teamProps.top - teamProps.height})`)
  .attr("width", menuProps.width)
  .attr("height", teamProps.button * 2 + teamProps.spacing)

// The year chart group element
const yearChart = svg.append("g")
  .attr("id", "yearChart")
  .attr("transform", `translate(${yearProps.left},${yearProps.top - yearProps.height})`)
  .attr("width", menuProps.width)
  .attr("height", yearProps.height)

// The player chart group element
const playerChart = svg.append("g")
  .attr("id", "playerChart")
  .attr("transform", `translate(${playerProps.left},${playerProps.top - playerProps.height})`)
  .attr("width", menuProps.width)
  .attr("height", playerProps.height)

// The container for the menu chart
const menuChart = svg.append("g")
  .attr("transform", `translate(${menuProps.left}, ${menuProps.top})`)
  .attr("width", menuProps.width)
  .attr("height", menuProps.height)

// MENU CHART ******************************************************************

function drawMenuChart() {

  // The function to call after clicking the team menu button
  function clickTeamButton() {
    showTeams = !showTeams
    showYears = false
    showPlayers = false
    updateMenuChart()
  }

  // The function to call after clicking the year menu button
  function clickYearButton() {
    showTeams = false
    showYears = !showYears
    showPlayers = false
    updateMenuChart()
  }

  // The function to call after clicking the player menu button
  function clickPlayerButton() {
    showTeams = false
    showYears = false
    showPlayers = !showPlayers
    updateMenuChart()
  }

  // The button for selecting a team
  const teamButton = menuChart.append("rect")
    .attr("id", "teamButton")
    .attr("class", "menu")
    .attr("fill", "#E4E4E4")
    .attr("stroke", "black")
    .attr("width", Math.round(menuProps.width / 3))
    .attr("height", menuProps.height)
    .on("click", clickTeamButton)

  // The label for selecting a team
  const teamLabel = menuChart.append("text")
    .text("SELECT A TEAM")
    .attr("id", "teamLabel")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("x", Math.round(menuProps.width / 6))
    .attr("y", Math.round(menuProps.height / 2))
    .on("click", clickTeamButton)

  // The button for selecting a year
  const yearButton = menuChart.append("rect")
    .attr("id", "yearButton")
    .attr("class", "menu")
    .attr("fill", "#E4E4E4")
    .attr("stroke", "black")
    .attr("x", Math.round(menuProps.width / 3))
    .attr("width", Math.round(menuProps.width / 3))
    .attr("height", menuProps.height)
    .on("click", clickYearButton)

  // The label for selecting a year
  const yearLabel = menuChart.append("text")
    .text("SELECT A SEASON")
    .attr("id", "yearLabel")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("x", Math.round(menuProps.width / 2))
    .attr("y", Math.round(menuProps.height / 2))
    .on("click", clickYearButton)

  // The button for selecting a player
  const playerButton = menuChart.append("rect")
    .attr("id", "playerButton")
    .attr("class", "menu")
    .attr("fill", "#E4E4E4")
    .attr("stroke", "black")
    .attr("x", Math.round(menuProps.width * 2 / 3))
    .attr("width", Math.round(menuProps.width / 3))
    .attr("height", menuProps.height)
    .on("click", clickPlayerButton)


  // The label for selecting a year
  const playerLabel = menuChart.append("text")
    .text("SELECT A PLAYER")
    .attr("id", "playerLabel")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("x", Math.round(menuProps.width * 5 / 6))
    .attr("y", Math.round(menuProps.height / 2))
    .on("click", clickPlayerButton)

}

// Displays the appropriate menu
function updateMenuChart() {

  // Show/hide the team chart
  d3.select("#teamChart")
    .transition()
    .attr("transform", `translate(
      ${teamProps.left},${teamProps.top - (showTeams ? 0 : teamProps.height)})`)

  // Show/hide the year chart
  d3.select("#yearChart")
    .transition()
    .attr("transform", `translate(
    ${yearProps.left},${yearProps.top - (showYears ? 0 : yearProps.height)})`)

  // Show/hide the player chart
  d3.select("#playerChart")
    .transition()
    .attr("transform", `translate(
  ${playerProps.left},${playerProps.top - (showPlayers ? 0 : playerProps.height)})`)
}

// TEAM CHART ******************************************************************

// Initial visualization of teams
function drawTeamChart() {

  // Draw background
  teamChart.append("rect")
    .attr("fill", "#E4E4E4")
    .attr("stroke", "black")
    .attr("opacity", 0.8)
    .attr("width", menuProps.width)
    .attr("height", teamProps.height)

  // Initial draw and add interactivity
  updateTeamChart()
  teams.forEach(team => {

    // Function to call after clicking a team
    function didClickTeam() {
      updateTeamChart(team)
      updatePlayerChart(null)
    }

    d3.select(`image#${team}`).on("click", didClickTeam)
    d3.select(`rect#${team}`).on("click", didClickTeam)
  })
}

function updateTeamChart(team) {
  // Update the selected team
  selectedTeam = selectedTeam === team ? null : team

  // Returns the scaling factor of the team logo
  function getFactor(d) {
    return selectedTeam === d ? teamProps.larger : teamProps.standard
  }

  // Positions and applies styling to image
  function updateLogo(image) {
    image
      .attr("width", d => teamProps.button * (1 + (getFactor(d))))
      .attr("height", d => teamProps.button * (1 + (getFactor(d))))
      .attr("x", d => {
        const index = teams.indexOf(d)
        const j = index % 15
        return (teamProps.button + teamProps.spacing) * j - Math.round(teamProps.button * getFactor(d) / 2) + teamProps.spacing
      })
      .attr("y", d => {
        const index = teams.indexOf(d)
        const i = Math.floor(index / 15)
        return (teamProps.button + teamProps.spacing) * i - Math.round(teamProps.button * getFactor(d) / 2) + teamProps.spacing
      })
      .attr("href", d => "./logos/" + d + ".svg")
      .attr("id", d => d)
      .attr("class", "logo")
  }

  // Update the label for the team
  d3.select("#teamLabel")
    .text(selectedTeam ?
      `${names[teams.indexOf(selectedTeam)]} (${selectedTeam})` : "SELECT A TEAM")

  // Data join for borders
  teamChart.selectAll("rect.logo")
    .data(teams)
    .join("rect")
    .attr("width", teamProps.button + 2)
    .attr("height", teamProps.button + 2)
    .attr("x", d => {
      const index = teams.indexOf(d)
      const j = index % 15
      return (teamProps.button + teamProps.spacing) * j - 1 + teamProps.spacing
    })
    .attr("y", d => {
      const index = teams.indexOf(d)
      const i = Math.floor(index / 15)
      return (teamProps.button + teamProps.spacing) * i - 1 + teamProps.spacing
    })
    .attr("rx", teamProps.corner)
    .attr("fill", "white")
    .attr("stroke", d => selectedTeam === d ? "red" : "black")
    .attr("stroke-width", d => selectedTeam === d ? 3 : 1)
    .attr("id", d => d)
    .attr("class", "logo")

  // Data join for team logos
  teamChart.selectAll("image.logo")
    .data(teams)
    .join(
      enter => updateLogo(enter.append("image")),
      update => updateLogo(update.transition()),
      exit => exit.remove()
    )
}

// YEAR CHART ******************************************************************

// Initial visualization of years
function drawYearChart() {

  // Draw background
  yearChart.append("rect")
    .attr("fill", "#E4E4E4")
    .attr("stroke", "black")
    .attr("opacity", 0.8)
    .attr("width", menuProps.width)
    .attr("height", yearProps.height)

  // Initial draw and add interactivity
  updateYearChart()
  years.forEach(year => {

    // Function to call after clicking a year
    function didClickYear() {
      updateYearChart(year)
      updatePlayerChart(null)
    }

    d3.select(`text#y${String(year)}`).on("click", didClickYear)
    d3.select(`rect#y${String(year)}`).on("click", didClickYear)
  })
}

function updateYearChart(year) {
  // Update the selected year
  selectedYear = selectedYear === year ? null : year

  // Returns the scaling factor of the year logo
  function getFactor(d) {
    return selectedYear === d ? yearProps.larger : yearProps.standard
  }

  // Positions and applies styling to image
  function updateText(text) {
    text
      .attr("width", d => yearProps.width * (1 + (getFactor(d))))
      .attr("height", d => yearProps.button * (1 + (getFactor(d))) / 2)
      .attr("x", d => {
        const i = years.indexOf(d)
        return (yearProps.width + yearProps.spacing) * i + (yearProps.width / 2) + yearProps.spacing
      })
      .attr("y", yearProps.button / 2 + 2 + yearProps.spacing)
      .text(d => (d - 1) + "-" + (d % 100))
      .attr("id", d => "y" + d)
      .attr("class", "year")
      .style("fill", "black")
      .attr("font-size", 20)
      .attr("font-weight", d => selectedYear === d ? "bold" : "normal")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
  }

  // Update the label for the year
  d3.select("#yearLabel")
    .text(selectedYear ?
      (year - 1) + "-" + (year % 100) : "SELECT A SEASON")

  // Data join for borders
  yearChart.selectAll("rect.year")
    .data(years)
    .join("rect")
    .attr("width", yearProps.width + 2)
    .attr("height", yearProps.button + 2)
    .attr("x", d => {
      const i = years.indexOf(d)
      return (yearProps.width + yearProps.spacing) * i - 1 + yearProps.spacing
    })
    .attr("y", yearProps.spacing)
    .attr("rx", yearProps.corner)
    .attr("fill", "white")
    .attr("stroke", d => selectedYear === d ? "red" : "black")
    .attr("stroke-width", d => selectedYear === d ? 3 : 1)
    .attr("id", d => "y" + d)
    .attr("class", "year")

  // Data join for year labels
  yearChart.selectAll("text.year")
    .data(years)
    .join(
      enter => updateText(enter.append("text")),
      update => updateText(update.transition()),
      exit => exit.remove()
    )

}

// PLAYER CHART ****************************************************************

function drawPlayerChart() {

  // Draw background
  playerChart.append("rect")
    .attr("fill", "#E4E4E4")
    .attr("stroke", "black")
    .attr("opacity", 0.8)
    .attr("width", menuProps.width)
    .attr("height", playerProps.height)

  // Draw background
  playerChart.append("text")
    .text("Please select a team and season first")
    .attr("x", menuProps.width / 2)
    .attr("y", playerProps.height / 2)
    .attr("id", "playerWarning")
    .style("fill", "black")
    .attr("font-size", 20)
    .attr("font-weight", "normal")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")

  // Initial draw and add interactivity
  updatePlayerChart(null)
  players.forEach(player => {
    function didClickPlayer() {
      updatePlayerChart(player)
    }

    d3.select(`text#p${player}`).on("click", didClickPlayer)
    d3.select(`rect#p${player}`).on("click", didClickPlayer)
  })

}

function updatePlayerChart(player) {
  // Update the selected player
  selectedPlayer = selectedPlayer === player ? null : player

  // Get the roster of players
  roster = (selectedTeam && selectedYear) ?
    stats[selectedYear].filter(player => player["Tm"] === selectedTeam) : []

  // Positions and applies styling to image
  function updateName(text) {
    text
      .attr("width", d => playerProps.width)
      .attr("height", d => playerProps.button)
      .attr("x", d => {
        const j = d % 5
        return (playerProps.width + playerProps.spacing) * j - 1 + playerProps.spacing + (playerProps.width / 2)
      })
      .attr("y", d => {
        const i = Math.floor(d / 5)
        return (playerProps.button + playerProps.spacing) * i + playerProps.spacing + (playerProps.button / 2)
      })
      .text(d => d < roster.length ? roster[d]["Player"] : "")
      .attr("id", d => "p" + d)
      .attr("class", "name")
      .style("fill", "black")
      .attr("font-size", 20)
      .attr("font-weight", d => selectedPlayer === d ? "bold" : "normal")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
  }

  // Update the warning for the player
  d3.select("#playerWarning")
    .text((selectedTeam && selectedYear) ? "" : "Please select a team and season first")

  // Update the label for the player
  d3.select("#playerLabel")
    .text(selectedPlayer !== null ? roster[selectedPlayer]["Player"] : "SELECT A PLAYER")

  // Data join for borders
  playerChart.selectAll("rect.name")
    .data(players)
    .join("rect")
    .attr("width", playerProps.width + 2)
    .attr("height", playerProps.button + 2)
    .attr("x", d => {
      const j = d % 5
      return (playerProps.width + playerProps.spacing) * j - 1 + playerProps.spacing
    })
    .attr("y", d => {
      const i = Math.floor(d / 5)
      return (playerProps.button + playerProps.spacing) * i + playerProps.spacing
    })
    .attr("rx", playerProps.corner)
    .attr("fill", "white")
    .attr("opacity", d => d < roster.length ? 1 : 0)
    .attr("stroke", d => selectedPlayer === d ? "red" : "black")
    .attr("stroke-width", d => selectedPlayer === d ? 3 : 1)
    .attr("id", d => "p" + d)
    .attr("class", "name")

  // Data join for players
  playerChart.selectAll("text.name")
    .data(players)
    .join(
      enter => updateName(enter.append("text")),
      update => updateName(update.transition()),
      exit => exit.remove()
    )

  updateStatChart()
  updateShotChart()
}

// STAT CHART ******************************************************************

const yearScale = d3.scalePoint()
  .domain(years)
  .range([0, statProps.width - (statProps.bar + statProps.spacing) * 3])

// The axis for the seasons
const yearAxis = d3.axisBottom()
const yearAxisG = statChart.append("g")
  .attr("transform", `translate(${Number(statProps.spacing + statProps.bar * 1.5)}, ${statProps.height + 10})`)

// The axis for different stats
const statAxis = d3.axisLeft().tickFormat(d3.format('.0%'))
const statAxisG = statChart.append("g")
  .attr("transform", `translate(-10, 0)`)

function drawStatChart() {
  statChart.append("rect")
    .attr("fill", "#E4E4E4")
    .attr("width", statProps.width)
    .attr("height", statProps.height)

  const leagueKey = statChart.append("rect")
    .attr("width", statProps.bar)
    .attr("height", statProps.bar)
    .attr("fill", color.league)
    .attr("x", statProps.bar)
    .attr("y", statProps.height + 50)

  const leagueLabel = statChart.append("text")
    .text("= NBA Average")
    .attr("fill", color.league)
    .attr("x", statProps.bar * 2 + 5)
    .attr("y", statProps.height + 50)
    .style("fill", "black")
    .attr("font-size", 20)
    .attr("font-weight", d => selectedYear === d ? "bold" : "normal")
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "hanging")

  const teamKey = statChart.append("rect")
    .attr("width", statProps.bar)
    .attr("height", statProps.bar)
    .attr("fill", color.team)
    .attr("x", statProps.bar + statProps.width / 3)
    .attr("y", statProps.height + 50)

  const teamLabel = statChart.append("text")
    .text("= Team Average")
    .attr("fill", color.league)
    .attr("x", statProps.bar * 2 + statProps.width / 3 + 5)
    .attr("y", statProps.height + 50)
    .style("fill", "black")
    .attr("font-size", 20)
    .attr("font-weight", d => selectedYear === d ? "bold" : "normal")
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "hanging")

  const playerKey = statChart.append("rect")
    .attr("width", statProps.bar)
    .attr("height", statProps.bar)
    .attr("fill", color.player)
    .attr("x", statProps.bar + statProps.width * 2 / 3)
    .attr("y", statProps.height + 50)

  const playerLabel = statChart.append("text")
    .text("= Player Average")
    .attr("fill", color.league)
    .attr("x", statProps.bar * 2 + statProps.width * 2 / 3 + 5)
    .attr("y", statProps.height + 50)
    .style("fill", "black")
    .attr("font-size", 20)
    .attr("font-weight", d => selectedYear === d ? "bold" : "normal")
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "hanging")
}

function updateStatChart() {
  if (!selectedTeam || !selectedYear) { return }

  const leagueStats = years.map(year => average[year]["NBA"])
  const teamStats = years.map(year => average[year][selectedTeam])

  yearAxis.scale(yearScale)
  yearAxisG.transition().call(yearAxis);

  const statScale = d3.scaleLinear()
    .domain([0, 1])
    .range([statProps.height, 5])

  statAxis.scale(statScale)
  statAxisG.transition().call(statAxis)

  statChart.selectAll("rect.leaguePCT")
    .data(leagueStats)
    .join(
      enter => enter.append('rect')
        .attr("class", "leaguePCT")
        .attr("fill", color.league)
        .attr("x", d => yearScale(leagueStats.indexOf(d) + years[0]))
        .attr("y", d => statScale(d))
        .attr("height", d => statProps.height - statScale(d))
        .attr("width", statProps.bar)
        .attr("opacity", 0)
        .call(enter => enter.transition().attr('opacity', 1)),
      update => update.call(update => update.transition()
        .attr("fill", color.league)
        .attr("x", d => yearScale(leagueStats.indexOf(d) + years[0]))
        .attr("y", d => statScale(d))
        .attr("height", d => statProps.height - statScale(d))
        .attr("width", statProps.bar)
        .attr("opacity", 0)
        .call(enter => enter.transition().attr('opacity', 1))),
      exit => exit.call(exit => exit.transition().attr('opacity', 0).remove()))

  statChart.selectAll("rect.teamPCT")
    .data(teamStats)
    .join(
      enter => enter.append('rect')
        .attr("class", "teamPCT")
        .attr("fill", color.team)
        .attr("x", d => yearScale(teamStats.indexOf(d) + years[0]) + statProps.bar + statProps.spacing)
        .attr("y", d => statScale(d))
        .attr("height", d => statProps.height - statScale(d))
        .attr("width", statProps.bar)
        .attr("opacity", 0)
        .call(enter => enter.transition().attr('opacity', 1)),
      update => update.call(update => update.transition()
        .attr("fill", color.team)
        .attr("x", d => yearScale(teamStats.indexOf(d) + years[0]) + statProps.bar + statProps.spacing)
        .attr("y", d => statScale(d))
        .attr("height", d => statProps.height - statScale(d))
        .attr("width", statProps.bar)
        .attr("opacity", 0)
        .call(enter => enter.transition().attr('opacity', 1))),
      exit => exit.call(exit => exit.transition().attr('opacity', 0).remove()))

  const playerStats = selectedPlayer !== null ? years.map(year => stats[year].filter(
    player => player["Player"] === roster[selectedPlayer]["Player"])[0]
  ) : []

  statChart.selectAll("rect.playerPCT")
    .data(playerStats)
    .join(
      enter => enter.append('rect')
        .attr("class", "playerPCT")
        .attr("fill", color.player)
        .attr("x", d => d ? yearScale(playerStats.indexOf(d) + years[0]) + (statProps.bar + statProps.spacing) * 2 : 0)
        .attr("y", d => d ? statScale(
          (Number(d["FGA"]) !== 0) ?
            Number(d["3PA"]) / (Number(d["FGA"])) :
            0
        ) : 0)
        .attr("height", d => d ? statProps.height - statScale(
          (Number(d["FGA"]) !== 0) ?
            Number(d["3PA"]) / (Number(d["FGA"])) :
            0
        ) : 0)
        .attr("width", statProps.bar)
        .attr("opacity", 0)
        .call(enter => enter.transition().attr('opacity', 1)),
      update => update.call(update => update
        .attr("fill", color.player)
        .attr("x", d => d ? yearScale(playerStats.indexOf(d) + years[0]) + (statProps.bar + statProps.spacing) * 2 : 0)
        .attr("y", d => d ? statScale((Number(d["FGA"]) !== 0) ?
          Number(d["3PA"]) / (Number(d["FGA"])) :
          0
        ) : statScale(0))
        .attr("height", d => d ? statProps.height - statScale((
          Number(d["FGA"]) !== 0) ?
          Number(d["3PA"]) / (Number(d["FGA"])) :
          0
        ) : 0)
        .attr("width", statProps.bar).transition()
        .attr("opacity", 0)
        .call(enter => enter.transition().attr('opacity', 1))),
      exit => exit.call(exit => exit.transition().attr('opacity', 0).remove()))
}

// SHOT CHART ******************************************************************

// The scale for the x-axis
const xShotScale = d3.scaleLinear()
  .domain([-250, 250])
  .range([0, shotProps.width])

// The scale for the y-axis
const yShotScale = d3.scaleLinear()
  .domain([0, 470])
  .range([0, shotProps.height])

// The function to draw the shot chart
function drawShotChart() {
  const court = shotPoints.append("rect")
    .attr("fill", "#E4E4E4")
    .attr("width", shotProps.width)
    .attr("height", shotProps.height)

  const border = shotLines.append("rect")
    .attr("width", shotProps.width)
    .attr("height", shotProps.height)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)

  const rim = shotLines.append("circle")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("r", yShotScale(15))
    .attr("cx", xShotScale(0))
    .attr("cy", yShotScale(60))

  const backboard = shotLines.append("line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("x1", xShotScale(-30))
    .attr("y1", yShotScale(40))
    .attr("x2", xShotScale(30))
    .attr("y2", yShotScale(40))

  const leftCorner = shotLines.append("line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 4)
    .attr("x1", xShotScale(-220))
    .attr("y1", yShotScale(0))
    .attr("x2", xShotScale(-220))
    .attr("y2", yShotScale(140))

  const rightCorner = shotLines.append("line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 4)
    .attr("x1", xShotScale(220))
    .attr("y1", yShotScale(0))
    .attr("x2", xShotScale(220))
    .attr("y2", yShotScale(140))

  const arc = shotLines.append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 4)
    .attr("d", `
    M ${xShotScale(-220)} ${yShotScale(140)} 
    A 220 140 0 0 0 ${xShotScale(220)} ${yShotScale(140)}
  `)

  const leftLane = shotLines.append("line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("x1", xShotScale(-80))
    .attr("y1", yShotScale(0))
    .attr("x2", xShotScale(-80))
    .attr("y2", yShotScale(190))

  const rightLane = shotLines.append("line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("x1", xShotScale(80))
    .attr("y1", yShotScale(0))
    .attr("x2", xShotScale(80))
    .attr("y2", yShotScale(190))

  const leftKey = shotLines.append("line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("x1", xShotScale(-60))
    .attr("y1", yShotScale(0))
    .attr("x2", xShotScale(-60))
    .attr("y2", yShotScale(190))

  const rightKey = shotLines.append("line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("x1", xShotScale(60))
    .attr("y1", yShotScale(0))
    .attr("x2", xShotScale(60))
    .attr("y2", yShotScale(190))

  const freethrow = shotLines.append("line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("x1", xShotScale(-80))
    .attr("y1", yShotScale(190))
    .attr("x2", xShotScale(80))
    .attr("y2", yShotScale(190))

  const topKey = shotLines.append("circle")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("r", yShotScale(60))
    .attr("cx", xShotScale(0))
    .attr("cy", yShotScale(190))

  const madeKey = shotLines.append("circle")
    .attr("r", 10)
    .attr("cx", shotProps.width / 5)
    .attr("cy", shotProps.height + 60)
    .attr("fill", color.make)
    .attr("opacity", 0.5)

  const madeLabel = shotChart.append("text")
    .text("= Made Shot")
    .attr("fill", color.league)
    .attr("x", shotProps.width / 5 + 15)
    .attr("y", statProps.height + 50)
    .style("fill", "black")
    .attr("font-size", 20)
    .attr("font-weight", d => selectedYear === d ? "bold" : "normal")
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "hanging")

  const missKey = shotLines.append("circle")
    .attr("r", 10)
    .attr("cx", shotProps.width * 3 / 5)
    .attr("cy", shotProps.height + 60)
    .attr("fill", color.miss)
    .attr("opacity", 0.5)

  const missLabel = shotChart.append("text")
    .text("= Missed Shot")
    .attr("fill", color.league)
    .attr("x", shotProps.width * 3 / 5 + 15)
    .attr("y", statProps.height + 50)
    .style("fill", "black")
    .attr("font-size", 20)
    .attr("font-weight", d => selectedYear === d ? "bold" : "normal")
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "hanging")
}

// The function to update the shot chart
function updateShotChart() {
  if (!selectedTeam || !selectedYear) {
    shotTitle.text("Select Team and Season to Visualize Shots Attempted")
    return
  }

  // If the shots you want to plot are a player's shots
  const data = selectedPlayer !== null ?
    shots[selectedYear][selectedTeam].filter(shot =>
      shot["PLAYER_NAME"] === roster[selectedPlayer]["Player"] &&
      shot["LOC_X"] > -250 && shot["LOC_X"] < 250 &&
      shot["LOC_Y"] > -60 && shot["LOC_Y"] < 400
    ).slice(0, maxShots) :
    shots[selectedYear][selectedTeam].filter(shot =>
      shot["LOC_X"] > -250 && shot["LOC_X"] < 250 &&
      shot["LOC_Y"] > -60 && shot["LOC_Y"] < 400
    ).slice(0, maxShots)

  shotPoints.selectAll("circle.shotchart")
    .data(data)
    .join("circle")
    .attr("class", "shotchart")
    .attr("r", 5)
    .attr("cx", d => xShotScale(d["LOC_X"]))
    .attr("cy", d => yShotScale(d["LOC_Y"]) + 60)
    .style("fill", d => d["EVENT_TYPE"] == "Missed Shot" ? color.miss : color.make)
    .attr("opacity", 0.5)
    .on("mouseover", function (d) {
      // TODO: Display this information somewhere
      // console.log(d3.select(this).datum())
    })

  shotTitle.text("Shots Attempted by " + (
    (selectedPlayer === null) ?
      `the ${names[teams.indexOf(selectedTeam)]} (${selectedTeam})` : roster[selectedPlayer]["Player"])
  )
}

// LOADING DATA ****************************************************************

// Load each team's stats for a given year
async function loadHelper(year) {
  const season = (year - 1) + "_" + (year % 100)
  return await Promise.all(teams.map(team => {
    try {
      return d3.csv("dataset/" + season + "/" + team + ".csv").catch(_ => [])
    } catch {
      return []
    }
  }))
}

// Load each year's stats
async function loadStats() {

  // Get the stat data from the season CSVs
  const statData = await Promise.all(years.map(year => {
    const season = (year - 1) + "_" + (year % 100)
    return d3.csv("dataset/" + season + "/" + season + ".csv")
  }))

  // Populate the stats dictionary
  for (var i = 0; i < years.length; i++) {
    stats[years[i]] = statData[i]
  }

  // Sanity Check
  console.log(stats)

  // Calculate league averages
  years.forEach(year => {
    var pa3 = 0
    var fga = 0
    const team3PA = {}
    const teamFGA = {}

    teams.forEach(team => {
      team3PA[team] = 0
      teamFGA[team] = 0
    })

    stats[year].forEach(player => {
      pa3 += Number(player["3PA"])
      fga += Number(player["FGA"])
      team3PA[player["Tm"]] += Number(player["3PA"])
      teamFGA[player["Tm"]] += Number(player["FGA"])
    })

    const result = {}
    result["NBA"] = pa3 / fga
    teams.forEach(team => result[team] = team3PA[team] / teamFGA[team])
    average[year] = result
  })


}

// Load each year's shots
async function loadShots() {

  // Get the shot data from the team CSVs
  const shotData = await Promise.all(years.map(year => loadHelper(year)))

  // Populate the shots dictionary
  for (var i = 0; i < years.length; i++) {
    const result = {}
    const teamData = shotData[i]
    for (var j = 0; j < teamData.length; j++) {
      result[teams[j]] = teamData[j]
    }
    shots[years[i]] = result
  }

  // Sanity Check
  console.log(shots)
}

// EXECUTION *******************************************************************

// Draw all charts
async function draw() {
  drawMenuChart()
  drawTeamChart()
  drawYearChart()
  drawPlayerChart()
  drawStatChart()
  drawShotChart()
}

// Load all data
async function load() {
  await loadStats()
  await loadShots()
}

async function run() {
  await draw()
  await load()
}

// TESTING *********************************************************************

// TODO: BEGIN REMOVE

// TODO: END REMOVE

run()
