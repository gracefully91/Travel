"""Download the latest official KTX workbook; run explicitly, never from the browser."""
import datetime,hashlib,json,pathlib,re,urllib.request,zipfile,io,xml.etree.ElementTree as E
folder=pathlib.Path('data/raw/rail');folder.mkdir(parents=True,exist_ok=True)
today=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat()
board_url='https://www.korail.com/com/userBoard.do?mode=list&schBcid=ticketTable'
def read(url):
 req=urllib.request.Request(url,headers={'User-Agent':'PyeongchangMiniature/1.0 timetable snapshot'})
 with urllib.request.urlopen(req,timeout=30)as response:return response.read()
raw=read(board_url);board=json.loads(raw);entry=next(v for v in board['boardList']if 'KTX'in v['bdTitle']and '시간표'in v['bdTitle']);m=re.search(r'(\d{4})\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2})',entry['bdTitle']);assert m,'Unrecognized effective date';effective=datetime.date(*map(int,m.groups())).isoformat();files=entry['fileId'];assert len(files)==1 and files[0].endswith('.xlsx')and '..'not in files[0]
url='https://www.korail.com/file/cubedata/COMMON/'+files[0];content=read(url);archive=zipfile.ZipFile(io.BytesIO(content));workbook=E.fromstring(archive.read('xl/workbook.xml'));assert any(s.attrib.get('name')=='강릉선'for s in workbook.iter()),'Gangneung sheet missing'
file='korail-ktx-'+effective+'.xlsx';(folder/file).write_bytes(content);(folder/f'korail-board-{today}.json').write_bytes(raw);metadata={'sourceUrl':url,'boardUrl':f"https://www.korail.com/com/userBoard.do?mode=view&schBcid=ticketTable&bdIdx={entry['bdIdx']}",'sourceTitle':entry['bdTitle'],'file':file,'effectiveFrom':effective,'verifiedAt':today,'reviewAfter':(datetime.date.fromisoformat(today)+datetime.timedelta(days=30)).isoformat(),'sha256':hashlib.sha256(content).hexdigest()};(folder/'source.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(metadata,ensure_ascii=False))
