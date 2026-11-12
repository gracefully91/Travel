import xml.etree.ElementTree as E,json
r=E.parse('data/raw/jinbu-osm.xml').getroot()
nodes={n.attrib['id']:{'lat':float(n.attrib['lat']),'lon':float(n.attrib['lon'])} for n in r.findall('node')}
es=[{'type':e.tag,'id':int(e.attrib['id']),'tags':{t.attrib['k']:t.attrib['v'] for t in e.findall('tag')},'geometry':[nodes[n.attrib['ref']] for n in e.findall('nd') if n.attrib['ref'] in nodes],**(nodes[e.attrib['id']] if e.tag=='node' else {})} for e in r if e.tag in ['node','way']]
json.dump({'elements':es},open('data/raw/jinbu-osm.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
