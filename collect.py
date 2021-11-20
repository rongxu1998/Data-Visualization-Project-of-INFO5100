"""
Script for collecting NBA data

This script iterates through the past 11 regular seasons of NBA basketball. For
each season, it gets the stats from basketball-reference.com for all active NBA 
playters from that season. It then searches up the IDs for the team and the
player using CSVs courtesy of Github user djblechn-su. Finally, it gets every
single shot attempted (made or missed) using the nba_api Python API. This script
runs on Python 3.8.8. Other versions of Python are not necessarily supported.

Authors: Jack Dauber (jd733), Jude Javillo (jij8), Jieyu Chen (jc3562), Rong Xu (rx25)
Date: 9 November 2021    
"""


# IMPORTS **********************************************************************


import json
import requests
import warnings
import unidecode
import pandas as pd
from io import StringIO
from bs4 import BeautifulSoup
from nba_api.stats.endpoints.shotchartdetail import ShotChartDetail

warnings.filterwarnings("ignore")


# CONSTANTS ********************************************************************


URL = 'https://raw.githubusercontent.com/djblechn-su/nba-player-team-ids/master/'
YEARS = range(2015, 2022, 1)
TEAMS = pd.read_csv(
    StringIO(
        requests.get(URL + 'NBA_Team_IDs.csv').text
    ), sep=",").set_index("BBRef_Team_Abbreviation")
PLAYERS = pd.read_csv(
    StringIO(
        requests.get(URL + 'NBA_Player_IDs.csv').text
    ), sep=",").set_index("BBRefName")


# FUNCTIONS ********************************************************************


def print_success(message):
    """
    Prints message with green text
    """
    print("\033[92m" + message + "\033[0m")


def print_failure(message):
    """
    Prints message with red text
    """
    print("\033[91m" + message + "\033[0m")


def get_team_id(abbrev):
    """
    Returns the ID associated with the provided NBA team's abbreviation
    """
    if abbrev == "CHO":
        return 1610612766
    for this_abbrev, team in TEAMS.iterrows():
        if this_abbrev == abbrev:
            return int(team['NBA_Current_Link_ID'])
    return -1


def get_player_id(name):
    """
    Returns the ID associated with the provided NBA player's name
    """
    name = unidecode.unidecode(name)
    for this_name, player in PLAYERS.iterrows():
        if this_name == name or \
            player["NBAName"] == name or \
                player["ESPNName"] == name:
            return int(player['NBAID'])

    return -1


# SCRIPT ***********************************************************************


# For each season
for year in YEARS:
    # At this point, we attempt to save a year's info
    print(year)

    # Get all of the players and what teams they were on
    roster = requests.get(
        'https://www.basketball-reference.com/leagues/NBA_{}_per_game.html'
        .format(year)
    ).text
    soup = BeautifulSoup(roster, 'html.parser')
    table = soup.find_all(class_="full_table")

    # Get the column names
    head = soup.find(class_="thead")
    column_names = [head.text for item in head][0].replace(
        "\n", ",").split(",")[2:-1]

    # Generate the roster (a list of dictionaries)
    roster = []
    for i in range(len(table)):
        player = []
        for td in table[i].find_all("td"):
            player.append(td.text)
        roster.append(player)

    # Save the season roster as a DataFrame
    seasonDF = pd.DataFrame(roster, columns=column_names).set_index("Player")
    seasonDF.index = seasonDF.index.str.replace('*', '')
    seasonDF.to_csv('dataset/{season}/{season}.csv'.format(
        season=str(year-1) + "_" + str(year % 100)
    ))

    # Start with no dataframe
    teamDF = {}

    # For each player in that season
    for name, player in seasonDF.iterrows():
        # At this point, we attempt to save a player's info
        print(name)

        # This could fail at any point; best not to lose progress
        try:
            # Get the IDs associated with the player and their team for the year
            team_id = get_team_id(player["Tm"])
            player_id = get_player_id(name)

            # If there are valid IDs for both team and player
            if team_id != -1 and player_id != -1:

                # At this point, we found the player and they were on a team
                print_success("Got Player")

                # Get their shot chart data
                shot_json = ShotChartDetail(
                    team_id=str(team_id),
                    player_id=str(player_id),
                    context_measure_simple='FGA',
                    season_nullable=str(year-1) + "-" + str(year % 100),
                    season_type_all_star='Regular Season')
                data = json.loads(shot_json.get_json())['resultSets'][0]
                headers = data['headers']
                rows = data['rowSet']

                # At this point, we successfully retrieved data on the player
                print_success("Got Data")

                # If there is good data
                if (len(rows) > 0):
                    # Parse their name to sort by last name alphabetically
                    space = name.find(" ")
                    first = name[:space]
                    last = name[space+1:]

                    # Create a dataframe for this player
                    playerDF = pd.DataFrame(rows)
                    playerDF.columns = headers

                    # Add the dataframe to the rest of the player's team
                    if player["Tm"] in teamDF:
                        teamDF[player["Tm"]].append(playerDF)
                    else:
                        teamDF[player["Tm"]] = [playerDF]

                    # At this point, we successfully recorded the player's data
                    print_success("Got Record")
            else:
                # At this point, the player was on multiple teams or isn't valid
                print_failure("ERROR: invalid IDS: ({team_id}, {player_id})".format(
                    team_id=team_id,
                    player_id=player_id
                ))

        # If it fails at any point
        except:
            # Print out the name and year that was unsuccessful
            print_failure("ERROR: couldn't get " + name + " in " + str(year))

    # Aggregate dataframes and convert to CSVs
    for team in teamDF:
        # At this point, we attempt to save a team's info
        print(team)

        # Append dataframes and convert to CSV
        finalDF = teamDF[team][0].append(teamDF[team][1:])
        finalDF.to_csv('dataset/{season}/{team}.csv'.format(
            season=str(year-1) + "_" + str(year % 100),
            team=team if team != "CHA" else "CHO"
        ))

        # At this point, we successfully recorded a team's shot data
        print_success("Got Team")
