import json,xml.etree.ElementTree as E,math,pathlib
root=pathlib.Path('data/raw/regions')
centers={'jinbu-town':('jinbu',37.63615615176021,128.55840330438474),'hoenggye-center':('hoenggye',37.6735929,128.7060213),'resorts-area':('resorts',37.6281511,128.6777287)}
# Rounded town-scale exploration edge centered on Jinbu terminal street.
# A soft radial variation keeps the outline organic while excluding Jinbu Station.
def rounded_jinbu_boundary(origin_lat,origin_lon):
 cx,cz=30.0,150.0;rx,rz=800.0,700.0;points=[]
 for i in range(64):
  angle=2*math.pi*i/64;scale=1+.05*math.sin(3*angle+.4)+.035*math.sin(2*angle-.7)+.02*math.sin(5*angle-.7)
  x=cx+rx*scale*math.cos(angle);z=cz+rz*scale*math.sin(angle)
  points.append([origin_lon+x/(111319.49079327358*math.cos(math.radians(origin_lat))),origin_lat+z/111319.49079327358])
 return points
def exported_hoenggye_boundary(origin_lat,origin_lon):
 reference=json.load(open(root/'hoenggye-user-export-boundary.json',encoding='utf-8'))
 refinement=json.load(open(root/'hoenggye-screen-refinement.json',encoding='utf-8'))
 west,south,east,north=reference['bbox'];width,height=reference['imageSize']
 mercator=lambda lat:math.log(math.tan(math.pi/4+math.radians(lat)/2))
 top,bottom=mercator(north),mercator(south);points=[]
 for x,y in refinement['pixels']:
  lon=west+(east-west)*x/width
  lat=math.degrees(2*math.atan(math.exp(top+(bottom-top)*y/height))-math.pi/2)
  points.append([(lon-origin_lon)*111319.49079327358*math.cos(math.radians(origin_lat)),(lat-origin_lat)*111319.49079327358])
 return points,{'type':'osm-export-screen-refined','orientation':'north-up','projection':'Web Mercator','imageSize':reference['imageSize'],'exportBbox':reference['bbox'],'referenceFile':'data/raw/regions/hoenggye-user-export-boundary.json','refinementFile':'data/raw/regions/hoenggye-screen-refinement.json','screenFitRmsPixels':refinement['edgeRmsPixels'],'preservedLowerVertices':refinement['preservedLowerVertices']}
def inside(point,polygon):
 x,y=point; hit=False
 for i,(x1,y1) in enumerate(polygon):
  x2,y2=polygon[(i+1)%len(polygon)]
  if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1:hit=not hit
 return hit
def exported_resorts_boundary(origin_lat,origin_lon,nodes):
 reference=json.load(open(root/'resorts-user-export-boundary.json',encoding='utf-8'))
 mercator=lambda lat:math.log(math.tan(math.pi/4+math.radians(lat)/2))
 controls=[]
 for control in reference['controlPoints']:
  lon,lat=nodes[control['osmNodeId']];px,py=control['pixel']
  controls.append(([math.radians(lon),mercator(lat)],[px,-py]))
 world_mean=[sum(a[k] for a,b in controls)/len(controls) for k in range(2)]
 pixel_mean=[sum(b[k] for a,b in controls)/len(controls) for k in range(2)]
 scale=sum((a[k]-world_mean[k])*(b[k]-pixel_mean[k]) for a,b in controls for k in range(2))/sum((a[k]-world_mean[k])**2 for a,b in controls for k in range(2))
 offset=[pixel_mean[k]-scale*world_mean[k] for k in range(2)]
 errors=[math.hypot(*(scale*a[k]+offset[k]-b[k] for k in range(2))) for a,b in controls]
 rms=math.sqrt(sum(e*e for e in errors)/len(errors))
 if rms>4:raise ValueError(f'Resort screenshot control-point residual exceeds 4px: {rms}')
 def geographic(x,y):return [math.degrees((x-offset[0])/scale),math.degrees(2*math.atan(math.exp((-y-offset[1])/scale))-math.pi/2)]
 points=[]
 for x,y in reference['pixels']:
  lon,lat=geographic(x,y)
  points.append([(lon-origin_lon)*111319.49079327358*math.cos(math.radians(origin_lat)),(lat-origin_lat)*111319.49079327358])
 width,height=reference['imageSize']
 return points,{'type':'osm-landmark-pixel-trace','orientation':'north-up','projection':'Web Mercator','imageSize':reference['imageSize'],'exportBbox':reference['bbox'],'calibratedImageBbox':geographic(0,height)+geographic(width,0),'controlPoints':[{**c,'lon':nodes[c['osmNodeId']][0],'lat':nodes[c['osmNodeId']][1],'errorPixels':errors[i]} for i,c in enumerate(reference['controlPoints'])],'rmsPixels':rms,'referenceFile':'data/raw/regions/resorts-user-export-boundary.json'}
def clipped_line(points,polygon):
 runs=[];run=[]
 for a,b in zip(points,points[1:]):
  cuts=[0.0,1.0];dx=b[0]-a[0];dy=b[1]-a[1]
  for c,d in zip(polygon,polygon[1:]+polygon[:1]):
   ex=d[0]-c[0];ey=d[1]-c[1];den=dx*ey-dy*ex
   if abs(den)<1e-12:continue
   qx=c[0]-a[0];qy=c[1]-a[1];t=(qx*ey-qy*ex)/den;u=(qx*dy-qy*dx)/den
   if -1e-10<=t<=1+1e-10 and -1e-10<=u<=1+1e-10:cuts.append(max(0,min(1,t)))
  cuts=sorted(set(cuts))
  for lo,hi in zip(cuts,cuts[1:]):
   mid=((a[0]+dx*(lo+hi)/2),(a[1]+dy*(lo+hi)/2))
   if inside(mid,polygon):
    start=(a[0]+dx*lo,a[1]+dy*lo);end=(a[0]+dx*hi,a[1]+dy*hi)
    if run and math.hypot(run[-1][0]-start[0],run[-1][1]-start[1])<.01:run.append(end)
    else:
     if len(run)>1:runs.append(run)
     run=[start,end]
   elif len(run)>1:runs.append(run);run=[]
 if len(run)>1:runs.append(run)
 return runs
for name in ['jinbu','hoenggye','resorts']:
 r=E.parse(root/(name+'.osm')).getroot();nodes={n.attrib['id']:[float(n.attrib['lon']),float(n.attrib['lat'])] for n in r.findall('node')};features=[]
 for w in r.findall('way'):
  t={x.attrib['k']:x.attrib['v'] for x in w.findall('tag')};p=[nodes[x.attrib['ref']] for x in w.findall('nd') if x.attrib['ref'] in nodes]
  if len(p)<2:continue
  kind='building' if 'building'in t else 'road' if 'highway'in t else 'rail' if t.get('railway')=='rail' else 'water' if 'waterway'in t or t.get('natural')=='water' else 'green' if t.get('natural')in ['wood','scrub'] or t.get('landuse')in ['forest','grass','village_green'] else None
  if not kind:continue
  features.append({'id':w.attrib['id'],'kind':kind,'points':p,'tags':{k:v for k,v in t.items() if k in ['name','highway','width','lanes','height','building:levels','building','natural','waterway','oneway','junction']}})
 source=json.load(open(root/(name+'-source.json'),encoding='utf-8'))
 json.dump({'id':name,'bbox':source['bbox'],'source':source,'features':features},open('public/maps/'+name+'.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
 print(name,{k:sum(f['kind']==k for f in features)for k in ['building','road','water','green','rail']})
 for key,(region,lat,lon)in centers.items():
  if region!=name:continue
  def local(p):return [(p[0]-lon)*111319.49079327358*math.cos(math.radians(lat)),(p[1]-lat)*111319.49079327358]
  selected=[]
  boundary_reference=None
  if key=='jinbu-town':boundary=[local(p) for p in rounded_jinbu_boundary(lat,lon)]
  elif key=='hoenggye-center':boundary,boundary_reference=exported_hoenggye_boundary(lat,lon)
  elif key=='resorts-area':boundary,boundary_reference=exported_resorts_boundary(lat,lon,nodes)
  else:boundary=None
  for f in features:
   points=[local(p) for p in f['points']]
   if boundary:
    if f['kind']=='rail' or (f['kind']=='building' and f['tags'].get('building')=='train_station'):continue
    if f['kind']=='building':
     if not inside((sum(p[0] for p in points[:-1])/max(1,len(points)-1),sum(p[1] for p in points[:-1])/max(1,len(points)-1)),boundary):continue
     selected.append({**f,'points':points});continue
    if f['kind'] in ['green','water'] and points[0]==points[-1]:
     if not all(inside(p,boundary) for p in points):continue
     selected.append({**f,'points':points});continue
    for segment_index,run in enumerate(clipped_line(points,boundary)):
     selected.append({**f,'id':f"{f['id']}-{segment_index}",'points':run})
    continue
   if any(abs(p[0])<230 and abs(p[1])<230 for p in points):selected.append({**f,'points':points})
  extent=225 if not boundary else max(max(max(abs(x),abs(z)) for f in selected for x,z in f['points']),max(max(abs(x),abs(z)) for x,z in boundary))+100
  view_center=[0,0] if not boundary else [30.0,150.0] if key=='jinbu-town' else [(min(p[0] for p in boundary)+max(p[0] for p in boundary))/2,(min(p[1] for p in boundary)+max(p[1] for p in boundary))/2]
  output={'id':key,'origin':{'lat':lat,'lon':lon},'extent':extent,'source':source,'features':selected,'assumptions':['Flat terrain: no DEM','Building height default 7 m','Road widths inferred when absent','Facade detail is simplified']}
  if boundary:output.update({'boundary':boundary,'viewCenter':view_center,'assumptions':output['assumptions']+(['Rounded town-sized exploration edge is approximated from the user-provided screenshot, not an official boundary','Train-station building and railway features are intentionally reserved for the station map'] if key=='jinbu-town' else ['User red outline traced from the OSM screenshot with known export bounds; pixel tracing approximate, north-up Web Mercator transform'])})
  if boundary_reference:output['boundaryReference']=boundary_reference
  if key=='resorts-area':output['assumptions'][-1]='Boundary traced from the user screenshot, georeferenced to four OSM summit symbols; export bbox is acquisition extent only; manual pixel error remains'
  json.dump(output,open('public/maps/'+key+'.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
  print(key,len(selected),'buildings',sum(f['kind']=='building'for f in selected),'extent',round(extent))
