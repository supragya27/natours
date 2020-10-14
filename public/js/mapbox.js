const locations= JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

mapboxgl.accessToken = 'pk.eyJ1Ijoic3VwcmFneWEyNyIsImEiOiJja2czY3dzZG0wOWY3MzNwNDRqdTF0d290In0.m6V2Wd932A0LBHl0_DMUyQ';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/supragya27/ckg63qmqu48g019k8pbwksn0m',
   });

const bounds=new mapboxgl.LngLatBounds();

locations.forEach(loc=>{
    //creating marker
    const el=document.createElement('div')
    el.className='marker';

    //adding marker
     new mapboxgl.Marker({
         element:el,
         anchor:'bottom'
     })
     .setLngLat(loc.coordinates)
     .addTo(map)

     

     //extending the map bounds to include current location
     bounds.extend(loc.coordinates)
})

map.fitBounds(bounds,{
         padding:{
             top:200,
             bottom:200,
             left:100,
             right:100
         }
     })