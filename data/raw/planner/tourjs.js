/**
 * 플레이스 상세 스크립트
 * */

let className;
let swipers = [];
settingSwipers();

$(".m-tabs-tab").click(function(){
    setTimeout(function(){
        settingSwipers();
    }, 300);        
    

   // settingMap(items);
});

function settingSwipers(){
    swipers.map(function(swiper){
        swiper.destroy();
    });

    swipers = [];

    $(".swiper").each(function(index, item){
        className = "swiper" + index;

        $(item).addClass(className);

        swipers.push(new Swiper("." + className + " .swiper-container", {
            loop: true,
            navigation: {
                nextEl: '.' + className + ' .swiper-btn-next',
                prevEl: '.' + className + ' .swiper-btn-prev',
            },
        }));
    });
}

/**
 * 
 * 
 */

var zonePlace = {
	init : function(){

		this.pathArray = document.location.href.split('/');
		
		let container = document.getElementById('map'); // 지도를 담을 영역	
		let options = { // 지도를 생성할 때 필요한 기본 옵션
			center: new kakao.maps.LatLng(this.params.lat, this.params.lon), // 지도의 중심좌표.
			level: 3 // 지도의 레벨(확대, 축소 정도)
		};	
		// 지도객체 생성
		map = new kakao.maps.Map(container, options);
		
		// 줌컨트롤 생성 / 확대,축소 막기
		var zoomControl = new kakao.maps.ZoomControl();
		map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
		map.setZoomable(false);
		
		// 본문 관광지 정보 세팅
		var array = new Array();
		zonePlace.item.isStart = 'Y';
		array.push(zonePlace.item);		
		settingMap(array);
		
		// 관광지:12, 숙박:2, 음식:3		
		zonePlace.list("12");
		zonePlace.course();		
		//zonePlace.list("2");		
		//zonePlace.list("3");
		
		// 마커이동
		$(document).on('click','.btnMarker',function(e){
			e.preventDefault();			
			openMarker($(this).data('no'));
		});
	},
	pathArray : "",
	item : {
		place_no : ""
	,	place_nm : ""
	,	place_type : ""
	,	lang_code : ""
	,	addrs : ""
	,	addrs_en : ""
	,	master_image : ""	
	,	lat : ""
	,	lon : ""
	},
	params : {
		lat : ""
	,	lon : ""
	,	place_no : ""
	,	place_type : ""
	,	pageSize : 8
	},
	list : function(placeType){
		//console.log(zonePlace.params);
		zonePlace.params.place_type = placeType;
		ajaxCall(zonePlace.params,'placeVicinityListJson');
		ajaxRes.success(function(result){
			//console.log(result)
			if(result.RESULT_CODE == 'SUCCESS'){
				var html=[], k=-1;
				$(result.RESULT_DATA).each(function(i, data){
					if(i < 3){					
						// makePlaceLink - /assets/plugin/comm/common.js 함수호출
						//html[++k] = '<a href="'+makePlaceLink(data.lang_code, data.place_no,data.place_class)+'" class="swiper-slide" target="_blank">';
						
						html[++k] = '<div class="m-board-wrap">';
						/*html[++k] = '	<a href="#" class="m-board">';*/
						html[++k] = '	<a href="'+makePlaceLink(data.lang_code, data.place_no, data.place_type)+'" class="m-board">';
						html[++k] = '		<div class="m-board-thumbnail m-ratioBox-wrap">';
						html[++k] = '			<div class="m-ratioBox">';
						if(data.master_image != ''){
							html[++k] = '				<img src="'+data.master_image+'" alt="">';
						}
						html[++k] = '			</div>';
						html[++k] = '		</div>';
						html[++k] = '		<div class="m-board-texts">';
						html[++k] = '			<div class="m-board-title">'+data.place_nm+'</div>';
						html[++k] = '			<p class="m-board-body">'+data.addrs+'</p>';
						html[++k] = '		</div>';
						html[++k] = '	</a>';
						html[++k] = '</div>';
					}
				});

				$('#dataVicinityArea').html(html.join('')).promise().done(function(){
					//createSwiper(".swiper");
				});
				
				
				/*
				$('#dataListArea_12').html(html.join('')).promise().done(function(){
					//createSwiper(".swiper");					
					
				});
				*/
/*
				$('#dataListArea_'+placeType).html(html.join('')).promise().done(function(){
					//createSwiper(".swiper0"+placeType);					
					//settingMap(result.RESULT_DATA);
				});
				*/
			}
		});
	},
	course : function(){		
		//zonePlace.params.place_type = placeType;
		zonePlace.params.place_no = zonePlace.item.place_no;
		//console.log(zonePlace.params);
		ajaxCall(zonePlace.params,'placeIncCourseListJson');
		ajaxRes.success(function(result){
			//console.log(result)
			if(result.RESULT_CODE == 'SUCCESS'){
				var html=[], k=-1;
				$(result.RESULT_DATA).each(function(i, data){
					var link ="#a";					
					if(i < 3){
						var link ="#a";
						// makePlaceLink - /assets/plugin/comm/common.js 함수호출
						//html[++k] = '<a href="'+makePlaceLink(data.lang_code, data.place_no,data.place_class)+'" class="swiper-slide" target="_blank">';
						
						//console.log(data.course_type);						
						//console.log(data);
						if(data.course_type == 'my'){							
							link = '/Home/H10000/H10300/placeCoursePlanDetail?course_no=1&course_type=my';
							
						}else{							
							link = '/Home/H10000/H10100/placeCoursePlanDetail?course_no='+data.course_no+'&course_type=recommend'
						}
						
						html[++k] = '<a href="'+link+'" class="m-board">';
						html[++k] = '	<div class="m-board-thumbnail m-ratioBox-wrap">';
						html[++k] = '		<div class="m-ratioBox">';
						html[++k] = '			<img src="'+data.master_image+'" alt="">';
						html[++k] = '		</div>';
						html[++k] = '	</div>';
						html[++k] = '	<div class="m-board-texts">';
						html[++k] = '		<p class="m-board-title">'+data.course_nm+'</p>';
						html[++k] = '		<p class="m-board-body">'+data.expl+'</p>';
						if(data.hashtag != ''){
						html[++k] = '		<div class="m-board-hashtags type01">';						
							var hashtag = data.hashtag.split(',');							
							for(var p=0; p<hashtag.length; p++){							
								html[++k] = '			<p class="m-board-hashtag">'+hashtag[p]+'</p>';								
							}						
						html[++k] = '		</div>';
						}
						html[++k] = '	</div>';
						html[++k] = '</a>';
					}
				});
				
				if(k == '-1'){
					//html[++k] = '<p class="m-board-empty">데이터가 없습니다.</p>';
					html[++k] = '<div class="m-empty-box type01" id="noDataArea" style="">';
					html[++k] = '<img src="/assets/front/img/logo-replace.png" alt="" class="deco">';
					html[++k] = '<h3 class="m-empty-text">검색 결과가 없습니다.</h3>';
					html[++k] = '</div>';
				}
				
				//console.log(html);

				$('#dataListCourseArea').html(html.join('')).promise().done(function(){
					//createSwiper(".swiper");
				});
				/*
				$('#dataListCourseArea').html(html.join('')).promise().done(function(){
					//createSwiper(".swiper");
				});
				*/	
			}
		});
	}
}