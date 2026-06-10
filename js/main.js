const map = L.map('map')
.setView([-7.98,112.63],12);

const osm = L.tileLayer(
'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
).addTo(map);

const satellite = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
);

L.control.layers({
"OSM":osm,
"Satellite":satellite
}).addTo(map);

L.control.scale().addTo(map);

map.on("mousemove",e=>{

document.getElementById("coordinate")
.innerHTML=

"X : "
+
e.latlng.lng.toFixed(5)

+
"<br>Y : "
+
e.latlng.lat.toFixed(5);

});

let sekolahData;
let kelurahanData;
let jangkauanData;

let sekolahLayer;
let kelurahanLayer;
let jangkauanLayer;

let highlightLayer;

Promise.all([

fetch("data/SD.geojson").then(r=>r.json()),
fetch("data/kelurahan.geojson").then(r=>r.json()),
fetch("data/jangkauan.geojson").then(r=>r.json()),
fetch("data/jalan.geojson").then(r=>r.json())

])

.then(([sd,kel,jangkauan,jalan])=>{

sekolahData=sd;
kelurahanData=kel;
jangkauanData=jangkauan;

document.getElementById("jumlahSekolah")
.innerHTML=sd.features.length;

document.getElementById("jumlahKelurahan")
.innerHTML=kel.features.length;

let rata=0;

kel.features.forEach(k=>{

rata += Number(
k.properties["pct terlayani"] || 0
);

});

document.getElementById("rataPelayanan")
.innerHTML=
(rata/kel.features.length)
.toFixed(2)
+" %";

L.geoJSON(jalan,{
style:{
color:"#444",
weight:1
}
}).addTo(map);

kelurahanLayer=L.geoJSON(kel,{

style:{
color:"#1565c0",
weight:1.5,
fillOpacity:0.2
},

onEachFeature:(feature,layer)=>{

let sekolahMelayani=[];

jangkauan.features.forEach(j=>{

if(
turf.booleanIntersects(
feature,
j
)
){

sekolahMelayani.push(
j.properties.remark
);

}

});

layer.bindPopup(`

<h3>${feature.properties.WADMKD}</h3>

<table class="popupTable">

<tr>
<td>Kecamatan</td>
<td>${feature.properties.WADMKC}</td>
</tr>

<tr>
<td>Luas</td>
<td>${Number(feature.properties.luas).toLocaleString()} m²</td>
</tr>

<tr>
<td>Luas Terlayani</td>
<td>${Number(feature.properties.Clipped_Luas).toLocaleString()} m²</td>
</tr>

<tr>
<td>Persentase</td>
<td>${feature.properties["pct terlayani"]}%</td>
</tr>

</table>

<hr>

<b>Sekolah Melayani</b>

<br>

${[...new Set(sekolahMelayani)].join("<br>")}

`);

}

}).addTo(map);

sekolahLayer=L.geoJSON(sd,{

pointToLayer:(feature,latlng)=>{

return L.circleMarker(latlng,{
radius:7,
fillColor:"red",
fillOpacity:1,
color:"#fff",
weight:1
});

},

onEachFeature:(feature,layer)=>{

layer.on("click",()=>{

if(highlightLayer){

map.removeLayer(highlightLayer);

}

let nama=
feature.properties.remark;

let jangkauanSekolah=

jangkauan.features.filter(j=>

j.properties.remark===nama

);

let kelurahanTerlayani=[];

kel.features.forEach(k=>{

jangkauanSekolah.forEach(j=>{

if(
turf.booleanIntersects(k,j)
){

kelurahanTerlayani.push(
k.properties.WADMKD
);

}

});

});

highlightLayer=
L.geoJSON(
{
type:"FeatureCollection",
features:jangkauanSekolah
},
{
style:{
color:"red",
weight:5
}
}
).addTo(map);

map.fitBounds(
highlightLayer.getBounds()
);

layer.bindPopup(`

<h3>${feature.properties.remark}</h3>

<table class="popupTable">

<tr>
<td>Nama</td>
<td>${feature.properties.remark}</td>
</tr>

<tr>
<td>Alamat</td>
<td>${feature.properties.alamat_1||"-"}</td>
</tr>

<tr>
<td>Status</td>
<td>${feature.properties.status_1||"-"}</td>
</tr>

<tr>
<td>Zona</td>
<td>${feature.properties.namobj||"-"}</td>
</tr>

<tr>
<td>Telepon</td>
<td>${feature.properties.telepon||"-"}</td>
</tr>

<tr>
<td>Dinas</td>
<td>${feature.properties.sbdata||"-"}</td>
</tr>

</table>

<hr>

<b>Kelurahan Terlayani</b>

<br>

${[...new Set(kelurahanTerlayani)].join("<br>")}

`).openPopup();

});

}

}).addTo(map);

const labels=[];
const values=[];

kel.features.forEach(k=>{

labels.push(
k.properties.WADMKD
);

values.push(
Number(
k.properties["pct terlayani"]
)
);

});

new Chart(

document.getElementById(
"chartPelayanan"
),

{

type:"bar",

data:{

labels:labels,

datasets:[{

label:"Persentase Pelayanan",

data:values

}]

}

}

);

});