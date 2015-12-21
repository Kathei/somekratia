import json, datetime
from urllib.request import urlopen

def get_url_as_string(url):
    json_str = urlopen(url).read().decode('utf-8')
    return json_str


def get_url_as_json(url):
    return json.loads(get_url_as_string(url))


def create_geo_json_feature(issue, coordinates):
    return {
            "id": issue['id'],
            "type": "Feature",
            "geometry": {
                "type": "Point", "coordinates": coordinates
                },
            "properties": {
                    "category_origin_id": issue["category_origin_id"],
                    "latest_decision_date": issue["latest_decision_date"],
                }
            }

server = 'http://dev.hel.fi'
path = '/paatokset/v1/issue/?limit=1000&order_by=latest_decision_date'
issue_index = []
geo_json = {'type': 'FeatureCollection', 'features': issue_index}
while path is not None:
    url = "%s%s" % (server, path)
    request_start = datetime.datetime.now()
    print("loading %s" % url)
    data = get_url_as_json(url)
    request_end = datetime.datetime.now()
    print("loaded %sms" % (request_end - request_start))
    meta = data['meta']
    path = meta['next']
    for issue in data['objects']:
        print("%s - %s" % (issue['last_modified_time'], issue['subject']))
        point_count = 0
        for geometry in issue['geometries']:
            if geometry['category'] == 'address' and len(geometry['coordinates']) == 2:
                point_count += 1
                print(str(geometry['coordinates']))
                issue_index.append(create_geo_json_feature(issue, geometry['coordinates']))
    print("index contains %d issues with coordinates" % (len(issue_index)))


print("Writing index to 'issue_index.json'...")
with open('issue_index.json', 'w') as outfile:
    json.dump(geo_json, outfile)
print("DONE!")



