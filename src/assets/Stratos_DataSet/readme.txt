Two data sets are available: AUSTRAL2017 (Australia) and TIMMINS2018 (Canada). In Australia a prototype of the PRISM was flown, with less capabilities, thus the limited sensor data (i.e. images + location). In Canada (Timmins, Ontario), an external sensor box was flown, which provided additional information about the flight (e.g. temperature, pressure, humidity...).
Here are informations about the proposed data sets:
Australia 2017:
You can access the 2017 data from the local data set provided, or from the web:
/AUSTRAL2017
or
https://ouvert.canada.ca/en 
Select "Open data" (will be redirected to https://open.canada.ca/en/open-data) 
Search for "stratos" 
Select " 
AUSTRAL2017 - Stratospheric Balloon Flight – Canadian Space Agency (CSA) Stratos Telemetry Subsystem
General info:
Launch at 2017-04-08 19:18:18.866 UTC 
Descent starts at 2017-04-09 07:13:42.754 UTC 
Landing at 2017-04-09 07:47:54.754 UTC 
For Australia flight, we do not have outside temperature/pressure data
AUSTRAL2017 proposed data set
Pictures straight down (AUSTRAL2017/nadir): 102.jpg - Rising sun on Australia's desert 
Pictures straight down: 120.jpg - Australian desert 
Pictures straight down: 280.jpg - Close to landing 
TXT data: dam_info.txt - Images time stamps 
"Taking auto PICAM image. Index = xxx" indicates that the system took STRAIGHT DOWN image xxx.jpg at the time indicated by the second element (as separated by commas) of the line. For example, picture straight down #102 was taken at 2017-04-08 21:38:42.866. Note that the time is provided in UTC (Universal Time Coordinates), and NOT local time.
TXT data: novatel_gpgga.txt 
See "Readme.txt" to know how to interpret this file's content 
Provides location data (longitude, latitude, altitude)
Canada 2018:
The 2018 data can be found on the local data set provided (/TIMMINS2018)
Relevant Documents:
Document csa_stratos_science_2018_prism_data (CSA-STRATOS-RPT-0093): Data set description + analysis 
TN2018-02-PRISM TMTC Interface Specification: Provides a description of the GENERAL formatting for telemetry. 
TN2018-03-PRISM Telemetry Definition: Provides a description of the content of each telemetry packet.
General Information:
2018-08-26 14:37:20 UTC: Landing - Atterrissage 
2018-08-26 03:20:01 UTC (23:20:01 local): Launch - Lancement 
2018-08-26 05:34:48 UTC: Ceiling reached – Atteinte du plafond 
2018-08-26 10:07:00 UTC: Sunrise – Levé du soleil 
2018-08-26 13:28:34 UTC: Maximum altitude (36,862.6m – Reported by CNES) – Altitude Maximale atteinte 
2018-08-26 14:03:33 UTC: Separation (start of descent under parachute – Début de la descente en parachute)
Proposed Data Set:
CDH/CAM1-NADIR/ and CDH/CAM2-HOR/: All images taken from the gondola during the flight (NADIR=from the camera pointing down, HOR=pointing at horizon). Exact time of each image is overlaid on most images, however to systematically know the time at which each picture was taken, you need to search the event log (see below). Example images: 
CAM1-NADIR/490L.jpg: An image from a camera pointing down at the Earth, from ceiling and daytime (13:48:28 UTC on 08/26/2018) 
CAM2-HOR/444.jpg: An image from a camera pointing toward horizon, at ceiling and daytime (12:12:16 UTC on 08/26/2018)
CDH/HKP/swcdh_events.txt: Provides a list of events that took place on the C&DH computer onboard, including when and how the pictures were taken. Note that NADIR pointing images were taken locally (Keyword "Taking onboard images") while HORIZON images were taken from another onboard computer, the NAVEM (keyword: "NAVEM"). For example, here are the two event log entries corresponding to the above mentioned images: 
SWCDH,2018-08-26 13:48:16.155,,EVENT,Taking onboard image: raspistill -n -vf -hf -q 100 -a 12 -t 2000 -o /mnt/ssd/swcdh/pictures/large/490.jpg 
SWCDH,2018-08-26 12:12:14.307,,EVENT,Requesting image from NAVEM: ssh root@172.20.4.202 raspistill -n -vf -hf -w 1920 -h 1080 -q 10 -a 12 -t 2000 -o /mnt/ssd/swcdh/pictures/444.jpg
NAVEM/swnav_pos0.txt: Provides gondola positioning information (i.e. latitude, longitude and altitude) during the full flight duration. NOTE: Also includes the Sun elevation angle (above horizon, with negative numbers indicating that the Sun has not risen yet), as seen from the gondola 
NAVEM/swnav_ahr0.txt: Provides gondola attitude and heading data for the gondola throughout the flight. 
NAVEM/swem_em0.txt: Provides environment data throughout the flight (e.g. external temperature, barometric pressure, humidity etc...). 
To interpret each line of those files, please refer to document TN2018-03-PRISM Telemetry Definition.docx. You can also refer to document Document csa_stratos_science_2018_prism_data.docx to verify that you interpreted data correctly.
