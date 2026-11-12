import urllib.request,json,pathlib,math
base=pathlib.Path('data/raw/connections');base.mkdir(parents=True,exist_ok=True)
places={'jinbu-station':{'lat':37.64273279258768,'lon':128.57445636859865},'jinbu-town':{'lat':37.63615615176021,'lon':128.55840330438474}}
def local(p,o):return [(p[0]-o['lon'])*math.pi/180*6378137*math.cos(o['lat']*math.pi/180),(p[1]-o['lat'])*math.pi/180*6378137]
connections=[]
for a,b in [('jinbu-station','jinbu-town'),('jinbu-town','jinbu-station')]:
 p,q=places[a],places[b];url=f"https://router.project-osrm.org/route/v1/driving/{p['lon']},{p['lat']};{q['lon']},{q['lat']}?overview=full&geometries=geojson";r=json.loads(urllib.request.urlopen(url,timeout=25).read());assert r['code']=='Ok';(base/f'{a}-to-{b}.json').write_text(json.dumps({'url':url,'acquiredAt':'2026-11-12','response':r},ensure_ascii=False),encoding='utf8');points=[local(c,p)for c in r['routes'][0]['geometry']['coordinates']];edge=230 if a=='jinbu-station'else 210
 for c,d in zip(points,points[1:]):
  if max(map(abs,c))<=edge and max(map(abs,d))>edge:
   ts=[(sgn*edge-c[i])/(d[i]-c[i])for i in [0,1]for sgn in [-1,1]if abs(d[i]-c[i])>1e-9 and 0<=(sgn*edge-c[i])/(d[i]-c[i])<=1];t=min(ts);length=math.hypot(d[0]-c[0],d[1]-c[1]);point=[c[i]+(d[i]-c[i])*max(0,t-6/length)for i in [0,1]];break
 else:raise Exception('No mapped road exit')
 roads=json.loads(pathlib.Path('data/processed/roads.json').read_text(encoding='utf-8-sig')) if a=='jinbu-station'else[{'id':f['id'],'points':f['points'],'tags':f['tags']}for f in json.loads(pathlib.Path('public/maps/jinbu-town.json').read_text(encoding='utf-8-sig'))['features']if f['kind']=='road']
 candidates=[]
 for road in roads:
  if road['tags'].get('highway')in['footway','path','steps','pedestrian','cycleway']:continue
  for c,d in zip(road['points'],road['points'][1:]):
   dx,dz=d[0]-c[0],d[1]-c[1];t=max(0,min(1,((point[0]-c[0])*dx+(point[1]-c[1])*dz)/(dx*dx+dz*dz)));snap=[c[0]+t*dx,c[1]+t*dz];candidates.append((math.hypot(snap[0]-point[0],snap[1]-point[1]),road,snap))
 distance,road,point=min(candidates,key=lambda v:v[0]);assert distance<15
 connections.append({'from':a,'to':b,'point':point,'roadId':road['id'],'roadName':road['tags'].get('name','역 진입 도로'),'routeSource':url,'source':'OSM centerline + OSRM driving route','acquiredAt':'2026-11-12','placement':'App navigation sign on the actual connecting road; not a surveyed roadside sign','meters':r['routes'][0]['distance'],'seconds':r['routes'][0]['duration']});print(connections[-1])
pathlib.Path('data/processed/scene-connections.json').write_text(json.dumps(connections,ensure_ascii=False,indent=2),encoding='utf8')

