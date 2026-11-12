"""Parse the official Korail Gangneung sheet. No network requests during app use."""
import math,json,zipfile,xml.etree.ElementTree as E,pathlib,re,hashlib
metadata=json.loads(pathlib.Path('data/raw/rail/source.json').read_text(encoding='utf8'))
SOURCE=metadata['sourceUrl']
p=pathlib.Path('data/raw/rail')/metadata['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==metadata['sha256'],'Workbook hash mismatch';z=zipfile.ZipFile(p);ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};strings=[''.join(v.itertext())for v in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)];sheets=E.fromstring(z.read('xl/workbook.xml'));sheet=next(s for s in sheets.findall('s:sheets/s:sheet',ns)if s.attrib['name']=='강릉선');rid=sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'];rels=E.fromstring(z.read('xl/_rels/workbook.xml.rels'));target=next(r.attrib['Target']for r in rels if r.attrib['Id']==rid);sheet_path=target.lstrip('/')if target.startswith('/')else'xl/'+target;rows=E.fromstring(z.read(sheet_path)).findall('.//s:row',ns);services=[];skipped=0;header_seen=False
for row in rows:
 n=int(row.attrib['r']);cells={re.sub(r'\d','',c.attrib['r']):strings[int(c.find('s:v',ns).text)]if c.attrib.get('t')=='s'else c.find('s:v',ns).text if c.find('s:v',ns)is not None else ''for c in row.findall('s:c',ns)}
 if n==8:
  assert '진부'in cells.get('O','')and '진부'in cells.get('AB','')and cells.get('B')=='열차번호'and cells.get('V')=='열차번호','Worksheet columns changed';header_seen=True
 for direction,num,kind,time,note in [('gangneung','B','C','O','T'),('seoul','V','W','AB','AN')]:
  if not re.fullmatch(r'\d+',cells.get(num,'')):continue
  value=float(cells.get(time,'0')or 0)
  if value<=0:skipped+=1;continue
  days=cells[note].strip();assert days=='매일'or all(d in '일월화수목금토'for d in days),days;weekdays=list(range(7))if days=='매일'else['일월화수목금토'.index(d)for d in days];second=math.floor(value*1440+1e-7)*60;assert 0<second<86400
  services.append({'id':direction+'-'+cells[num],'trainNumber':cells[num],'trainType':cells[kind],'direction':direction,'stationSecond':second,'time':f'{second//3600:02}:{second//60%60:02}:{second%60:02}','weekdays':weekdays,'operationNote':days,'sourceCell':f'{time}{n}','sourceExcelSerial':value})
assert header_seen,'Missing station headers'
assert len({s['id']for s in services})==len(services),'Duplicate service IDs'
assert services and all(any(s['direction']==d for s in services)for d in ['gangneung','seoul']),'Missing station services'
services.sort(key=lambda v:v['stationSecond']);result={'station':'진부(오대산)','timezone':'Asia/Seoul','precision':'minute (source display format h:mm; hidden fractional seconds are not claimed)' ,'effectiveFrom':metadata['effectiveFrom'],'verifiedAt':metadata['verifiedAt'],'reviewAfter':metadata['reviewAfter'],'reviewPolicy':'30-day application review window, not an official timetable expiry','sourceUrl':SOURCE,'boardUrl':metadata['boardUrl'],'sourceTitle':metadata['sourceTitle'],'sourceSheet':'강릉선','sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'note':'진부 정차 시각을 기준으로 한 미니어처 통과 표현. 실제 위치·지연·승강장 배정 미반영. 미정차 열차의 통과시각은 추정하지 않음. 산천 모델은 대표 시각화이며 실제 차종은 trainType 필드 참고. 공휴일 특수 운행은 확인되지 않음.','skippedNonStopping':skipped,'services':services};pathlib.Path('data/processed/jinbu-train-timetable.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');print('station services',len(services),'nonstopping skipped',skipped);print([(v['id'],v['time'],v['operationNote'])for v in services])
