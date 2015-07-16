from flask import Flask, render_template, abort, request, jsonify, g
import sqlite3

app = Flask(__name__)
DATABASE = 'atpdb'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = connect_db()
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def connect_db():
    return sqlite3.connect(DATABASE)


@app.route('/')
def home_page():
    return render_template('index.html')

def search_db(opponent1, opponent2):
	c = get_db().cursor()
	for row in c.execute('SELECT w_ace, w_df, w_svpt, w_1stIn, w_1stWon, w_2ndWon, l_ace, l_df, l_svpt, l_1stIn, l_1stWon, l_2ndWon, surface, year FROM matches where ( loser_name == ?  AND winner_name = ? )', [opponent2, opponent1]):
		o = list(row)
		o.append('r_win')
		yield o
	for row in c.execute('SELECT l_ace, l_df, l_svpt, l_1stIn, l_1stWon, l_2ndWon, w_ace, w_df, w_svpt, w_1stIn, w_1stWon, w_2ndWon, surface, year FROM matches where ( winner_name == ? AND loser_name = ? )', [opponent2, opponent1]):
		o = list(row)
		o.append('o_win')
		yield o

def search_country(country_code):	
	c = get_db().cursor()
	retval = {}
	print country_code
	##print country_code
	for row in c.execute("SELECT Country, Color1, Color2, Color3 FROM countries where ( IOC2 == ? )", [country_code]):
		##print row
		retval['Name'] = row[0]
		retval['Color1'] = row[1]
		retval['Color2'] = row[2]
		retval['Color3'] = row[3]
	return retval
	

@app.route('/opponents/<player>')
def find_opponents(player):
	c = get_db().cursor()
	opponents = set()
	for row in c.execute('SELECT winner_name FROM matches where ( loser_name == ? )', [player]):
		opponents.add(row[0])
	for row in c.execute('SELECT loser_name FROM matches where ( winner_name == ? )', [player]):
		opponents.add(row[0])
	#print list(opponents)
	return jsonify(opponents=list(opponents))

@app.route('/id/<player>')
def find_ID(player):
	c = get_db().cursor()
	#TODO: This needs to be refactored
	# Search also for the player's ID
	playerID = ""
	for row in c.execute('SELECT ID FROM players where ( Name == ? ) limit 1', [player]):
		playerID = row[0]
	return jsonify(playerID=playerID);

@app.route('/name/<ID1>/<ID2>')
def find_name(ID1, ID2):
	c = get_db().cursor()
	playerName1 = ""
	for row in c.execute('SELECT Name FROM players where ( ID == ? ) limit 1', [int(ID1)]):
		playerName1 = row[0]
	playerName2 = ""
	for row in c.execute('SELECT Name FROM players where ( ID == ? ) limit 1', [int(ID2)]):
		playerName2 = row[0]
	return jsonify(name=[playerName1, playerName2]);

@app.route('/country/<player>')
def find_country(player):
	c = get_db().cursor()
	ioc = ""
	for row in c.execute('SELECT winner_ioc FROM matches where ( winner_name == ? ) limit 1', [player]):
		ioc = row[0]
	if (ioc == ""):
		for row in c.execute('SELECT loser_ioc FROM matches where ( loser_name == ? ) limit 1', [player]):
			ioc = row[0]
	country = search_country(ioc)
	return jsonify(country=country);

@app.route('/versus/<opponent1>/<opponent2>/<surface>')
def find_stats(opponent1, opponent2, surface):
	c = get_db().cursor()
	features = {}
	features['r_aces'] = 0
	features['r_df'] = 0
	features['r_svpt'] = 0
	features['r_1stIn'] = 0
	features['r_1stWon'] = 0
	features['r_2ndWon'] = 0
	features['r_win'] = {'Overall': 0, 'Clay' : 0, 'Carpet': 0, 'Hard': 0, 'Grass': 0}
	features['o_aces'] = 0
	features['o_df'] = 0
	features['o_svpt'] = 0
	features['o_1stIn'] = 0
	features['o_1stWon'] = 0
	features['o_2ndWon'] = 0
	features['o_win'] = {'Overall': 0, 'Clay' : 0, 'Carpet': 0, 'Hard': 0, 'Grass': 0}
	features['wintimeline'] = {}
	
	for row in search_db(opponent1, opponent2):
		if ",".join(row).find(',,') == -1:
			if surface == 'Overall' or row[12] == surface:
				features['r_aces'] = features['r_aces'] + int(row[0])
				features['r_df'] = features['r_df'] + int(row[1])
				features['r_svpt'] = features['r_svpt'] + int(row[2])
				features['r_1stIn'] = features['r_1stIn'] + int(row[3])
				features['r_1stWon'] = features['r_1stWon'] + int(row[4])
				features['r_2ndWon'] = features['r_2ndWon'] + int(row[5])

				features['o_aces'] = features['o_aces'] + int(row[6])
				features['o_df'] = features['o_df'] + int(row[7])
				features['o_svpt'] = features['o_svpt'] + int(row[8])
				features['o_1stIn'] = features['o_1stIn'] + int(row[9])
				features['o_1stWon'] = features['o_1stWon'] + int(row[10])
				features['o_2ndWon'] = features['o_2ndWon'] + int(row[11])
		features[row[14]]['Overall'] = features[row[14]]['Overall'] + 1
		features[row[14]][row[12]] = features[row[14]][row[12]] + 1	
		if row[13] not in features['wintimeline']:
			features['wintimeline'][row[13]] = {'r_win': {'Clay' : {'wins':0, 'norm': 0.0}, 'Carpet': {'wins':0, 'norm': 0.0}, 'Hard': {'wins':0, 'norm': 0.0}, 'Grass': {'wins':0, 'norm': 0.0}, 'Overall': 0}, 'o_win': {'Clay' : {'wins':0, 'norm': 0.0}, 'Carpet': {'wins':0, 'norm': 0.0}, 'Hard': {'wins':0, 'norm': 0.0}, 'Grass': {'wins':0, 'norm': 0.0}, "Overall": 0}}
		features['wintimeline'][row[13]][row[14]][row[12]]['wins'] += 1
		features['wintimeline'][row[13]][row[14]]['Overall'] += 1

	#Go through and normalize win timeline
	for year in features['wintimeline'].values():
		total = max(year['r_win']['Overall'], year['o_win']['Overall'])
		for player in year.values():
			del player['Overall']
			if total > 0:
				for surface in player.values():	
					surface['norm'] = float(surface['wins'])/float(total)
			#Delete the Overall category
			

	return jsonify(features)
	

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug='True')
