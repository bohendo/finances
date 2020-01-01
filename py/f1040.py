#!/bin/python
import sys
from utils import *

########################################
# Read data from input files

personal_data=sys.argv[1]
build_dir=sys.argv[2]
data_dir=sys.argv[3]

personal = loadJSON(personal_data)
f1040s1=loadJSON(data_dir+'/f1040s1.json')
f1040s3=loadJSON(data_dir+'/f1040s3.json')
f1040s4=loadJSON(data_dir+'/f1040s4.json')

f1040 = personal["f1040"]

print(f1040)

########################################
# Build the form

f1040['FirstNameAndInitial'] = '%s %s' % (personal['FirstName'], personal['MiddleInitial'])
f1040['LastName'] = personal['LastName']
f1040['SocialSecurityNumber'] = personal['SocialSecurityNumber']

f1040['SpouseFirstNameAndInitial'] = '%s %s' % (personal['SpouseFirstName'], personal['SpouseMiddleInitial'])
f1040['SpouseLastName'] = personal['SpouseLastName']
f1040['SpouseSocialSecurityNumber'] = personal['SpouseSocialSecurityNumber']

line3a = 0
line3b = 0
dividends = [] if 'dividends' not in personal['income'] else personal['income']['dividends']
for dividend in dividends:
  line3b += float(dividend['amount'])
  if dividend['type'] == 'qualified':
    line3a += float(dividend['amount'])
f1040['Line3a'] = toForm(line3a, 0)
f1040['Line3ac'] = toForm(line3a, 1)
f1040['Line3b'] = toForm(line3b, 0)
f1040['Line3bc'] = toForm(line3b, 1)

line6extra = fromForm(f1040s1['Line22'], f1040s1['Line22c'])
f1040['Line6Extra'] = toForm(line6extra, 0) + '.' + toForm(line6extra, 1)
line6 = line6extra
for line in [1,'2b','3b','4b','5b']:
  value = fromForm(f1040['Line' + str(line)], f1040['Line'+str(line)+'c'])
  line6 += value
f1040['Line6'] = toForm(line6, 0)
f1040['Line6c'] = toForm(line6, 1)

line7 = line6 - fromForm(f1040s1['Line36'], f1040s1['Line36c'])
f1040['Line7'] = toForm(line7, 0)
f1040['Line7c'] = toForm(line7, 1)

if f1040['FilingSingle'] or f1040['FilingMarriedSeparate']:
  line8 = 12000
elif f1040['FilingMarriedJointly'] or f1040['FilingWidow']:
  line8 = 24000
elif f1040['FilingHeadOfHousehold']:
  line8 = 18000
f1040['Line8'] = toForm(line8, 0)
f1040['Line8c'] = toForm(line8, 1)

line10 = line7 - line8 - fromForm(f1040['Line9'], f1040['Line9c'])
line10 = line10 if line10 >= 0 else 0
f1040['Line10'] = toForm(line10, 0)
f1040['Line10c'] = toForm(line10, 1)


# TODO: tax table?!
if line10 == 0:
  line11 = 0
elif line10 >= 39300 and line10 < 39350 and f1040['FilingMarriedJointly']:
  line11 = 4338
elif line10 >= 44300 and line10 < 44350 and f1040['FilingMarriedJointly']:
  line11 = 4938
elif line10 >= 45000 and line10 < 45050 and f1040['FilingMarriedJointly']:
  line11 = 5022
elif line10 >= 45250 and line10 < 45300 and f1040['FilingMarriedJointly']:
  line11 = 5052
elif line10 >= 45300 and line10 < 45350 and f1040['FilingMarriedJointly']:
  line11 = 5058
elif line10 >= 47150 and line10 < 47200 and f1040['FilingMarriedJointly']:
  line11 = 5280
elif line10 >= 47200 and line10 < 47250 and f1040['FilingMarriedJointly']:
  line11 = 5286
elif line10 >= 47250 and line10 < 47300 and f1040['FilingMarriedJointly']:
  line11 = 5292
elif line10 >= 49700 and line10 < 49750 and f1040['FilingMarriedJointly']:
  line11 = 5586
elif line10 >= 51200 and line10 < 51250 and f1040['FilingMarriedJointly']:
  line11 = 5766
elif line10 >= 53350 and line10 < 53400 and f1040['FilingMarriedJointly']:
  line11 = 6024
else:
  print('Oh no, tax table not implemented, please add entry for income of: %d' % line10)
  line11 = line10 * 0.111


f1040['Line11a'] = toForm(line11, 0) + '.' + toForm(line11, 1)
f1040['Line11'] = toForm(line11, 0)
f1040['Line11c'] = toForm(line11, 1)

line12 = fromForm(f1040s3['Line55'], f1040s3['Line55c'])
if line12 > 0:
  f1040['Line12Schedule3'] = True
  f1040['Line12'] = toForm(line12, 0)
  f1040['Line12c'] = toForm(line12, 1)

line13 = line11 - fromForm(f1040['Line12'], f1040['Line12c'])
line13 = line13 if line13 >= 0 else 0
f1040['Line13'] = toForm(line13, 0)
f1040['Line13c'] = toForm(line13, 1)

line14 = fromForm(f1040s4['Line64'], f1040s4['Line64c'])
f1040['Line14'] = toForm(line14, 0)
f1040['Line14c'] = toForm(line14, 1)

line15 = line13 + line14
f1040['Line15'] = toForm(line15, 0)
f1040['Line15c'] = toForm(line15, 1)

line16 = fromForm(f1040['Line16'], f1040['Line16c'])
line17 = fromForm(f1040['Line17'], f1040['Line17c'])
line18 = line16 + line17
f1040['Line18'] = toForm(line18, 0)
f1040['Line18c'] = toForm(line18, 1)

line19 = line18 - line15
line19 = line19 if line19 >= 0 else 0
f1040['Line19'] = toForm(line19, 0)
f1040['Line19c'] = toForm(line19, 1)

f1040['Line21'] = toForm(line19, 0)
f1040['Line21c'] = toForm(line19, 1)

line22 = line15 - line18
line22 = line22 if line22 >= 0 else 0
f1040['Line22'] = toForm(line22, 0)
f1040['Line22c'] = toForm(line22, 1)

########################################
# Write form data to file

with open(data_dir+'/f1040.json', "wb") as output:
  json.dump(f1040, output)