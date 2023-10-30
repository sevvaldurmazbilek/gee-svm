/*

Please paste the code into Google Earth Engine Code Editor. 
Import your boundaries, training and validation data regarding the land cover classes.
Choose specific classifier that you want to clasify your data. (SVM, Random Forest, CART, NaiveBayes)

*/

// import the boundaries
// filtering

function maskS2clouds(image) {
    var qa = image.select('QA60');
  
    // Bits 10 and 11 are clouds and cirrus, respectively.
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
  
    // Both flags should be set to zero, indicating clear conditions.
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  
    return image.updateMask(mask).divide(10000);
  }
  
  
  var image = ee.ImageCollection('COPERNICUS/S2_SR')
                    .filterDate('2020-06-01', '2020-08-31')
                    .filterBounds(boundary)
                    // Pre-filter to get less cloudy granules.
                    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                    .map(maskS2clouds)
                    .mean();
                    
  
  var clip = image.clip(boundary);
  
  
  var visualization = {
    min: 0.0,
    max: 0.3,
    bands: ['B4', 'B3', 'B2'],
  };
  
  //Map.addLayer(clip, visualization, 'RGB');
  //Map.addLayer(boundary, {}, 'ROI'); 
  
  Map.centerObject(boundary); 
  
  //ADDITIONAL BANDS
  
  var ndvi = clip.expression('(NIR-Red)/(NIR+Red)',{
    'NIR': clip.select('B8'),
    'Red': clip.select('B4')
  });
  
  var savi = clip.expression('((NIR-Red)/(NIR+Red+0.5))*(1.0+0.5)',{
    'NIR': clip.select('B8'),
    'Red': clip.select('B4')
  });
  
  var ndwi = clip.expression('(Green-NIR)/(Green+NIR)',{
    'NIR': clip.select('B8'),
    'Green': clip.select('B3')
  })  ;
  
  var mndwi = clip.expression('(Green-SWIR1)/(Green+SWIR1)',{
    'SWIR1': clip.select('B11'),
    'Green': clip.select('B3')
  }) ;
  
  var ndbi = clip.expression('(SWIR1-NIR)/(SWIR1+NIR)',{
    'SWIR1': clip.select('B11'),
    'NIR': clip.select('B8')
  }) ;
  
  var ui = clip.expression('(SWIR2-NIR)/(SWIR2+NIR)',{
    'SWIR2': clip.select('B12'),
    'NIR': clip.select('B8')
  }) ;
  
  var ndti = clip.expression('(SWIR1-SWIR2)/(SWIR1+SWIR2)',{
    'SWIR1': clip.select('B11'),
    'SWIR2': clip.select('B12')
  }) ;
  
  var ndvire = clip.expression('(RedEdge1-Red)/(RedEdge1+Red)',{
    'RedEdge1': clip.select('B5'),
    'Red': clip.select('B4')
  }) ;
  
  
  // ADD 
  
  var final = clip.addBands(ndvi.rename('NDVI'))
                  .addBands(savi.rename('SAVI'))
                  .addBands(ndwi.rename('NDWI'))
                  .addBands(mndwi.rename('mNDWI'))
                  .addBands(ndbi.rename('NDBI'))
                  .addBands(ui.rename('UI'));
  
                   
  Map.addLayer(final, visualization, 'RGB2');
  //Map.addLayer(ndvi,visualization2, 'NDVI')


  // Training data
  
  var urbanfabric = ee.FeatureCollection('ENTER_YOUR_PATH');
  var roads = ee.FeatureCollection('ENTER_YOUR_PATH');
  var minedump = ee.FeatureCollection('ENTER_YOUR_PATH');
  var artvegareas = ee.FeatureCollection('ENTER_YOUR_PATH');
  var arableland = ee.FeatureCollection('ENTER_YOUR_PATH');
  var forests = ee.FeatureCollection('ENTER_YOUR_PATH');
  var scrub = ee.FeatureCollection('ENTER_YOUR_PATH');
  var openspaces = ee.FeatureCollection('ENTER_YOUR_PATH');
  var inlandwetlands = ee.FeatureCollection('ENTER_YOUR_PATH');
  var inlandwaters = ee.FeatureCollection('ENTER_YOUR_PATH');
  var marinewaters = ee.FeatureCollection('ENTER_YOUR_PATH');
  
  var landcover = urbanfabric.merge(roads).merge(minedump).merge(artvegareas).merge(arableland).merge(forests).merge(scrub).merge(openspaces).merge(inlandwetlands).merge(inlandwaters).merge(marinewaters);
  
  print(landcover);
  
  // select bands for training 
  
  var bands = ['B2','B3','B4','B5','B6','B7','B8','B11','B12','NDVI','SAVI','NDWI','mNDWI','NDBI','UI'];
  
  // create sample region 
  
  var classProperty = 'landcover';
  
  // training
  
  var training = final.select(bands).sampleRegions({
    collection: landcover,
    properties: [classProperty],
    scale: 20,
  });
  
  training = training.randomColumn("random", 1);
  training = ee.FeatureCollection(ee.List(training.sort("random").iterate(function(f,l){
    l = ee.List(l);
    return l.add(f.set("fold",l.size().divide(training.size())))
  },[])));
  
  // TRAIN THE CLASSIFIER
  // SVM 
  
  var classifier = ee.Classifier.libsvm({
    kernelType: 'RBF',
    gamma: 0.1,
    cost: 1000
  });

  /*
  RANDOM FOREST

  var classifier = ee.Classifier.smileRandomForest(500)});

  Number of the trees were selected as 500 based on the litature review. 

  */

  /*
  CART

  var classifier = ee.Classifier.smileCart();

  */

  /*

  Naive Bayes

  var classifier = ee.Classifier.smileNaiveBayes(); 

  */
  
  
  var trained = classifier.train(training, classProperty, bands);
  
  
  // classifiy the input imagery
  
  var classified = final.select(bands).classify(trained);
  
  // define color palette 
  
  var palette = [
    'e6004d', // urbanfabric (0) //
    'cc0000', // roads (1) //
    'ff4dff', // minedump (2) //
    'ffa6ff', // artvegareas (3) //
    'ffffa8', // arableland (4) //
    '4dff00', // forests (5) //
    'ccf24d', // scrub (6) //
    'e6e6e6', // openspaces (7) //
    'a6a6ff', // inlandwetlands (8) //
    '80f2e6', // inlandwaters (9) //
    'e6f2ff', // marinewaters (10) //
    ];
  
  // display
  Map.addLayer(classified, {min: 0, max: 10, palette: palette}, 'LCLU');
  
  // K-FOLD CROSS VALIDATION 

  var k = 5;
  var kfoldClassified = ee.ImageCollection(
    ee.List.sequence(0, k-1).map(
      function(r){
        var startRange = ee.Number(r).divide(k);
        var endRange =startRange.add(ee.Number(1).divide(k));
        var train = training
          .filter(
            ee.Filter.or(
              ee.Filter.lt("fold", startRange),
              ee.Filter.gte("fold", endRange)
            )
          );
        var validation = training
          .filter(
            ee.Filter.and(
              ee.Filter.gte("fold", startRange),
              ee.Filter.lt("fold", endRange)
            )
          );
        var trainedcls = classifier.train(train, classProperty, bands);
        var classified = final.classify(trainedcls);
        var validated = validation.classify(trainedcls)
                                  .errorMatrix(classProperty, 'classification');
        return classified
               .set("TrainMatrix", trainedcls.confusionMatrix().array())
               .set("ValidationMatrix",validated.array())
               .set("TrainAcc", trainedcls.confusionMatrix().accuracy())
               .set("ValidationAcc", validated.accuracy())
               .set("ProducersAcc", validated.producersAccuracy())
               .set("ConsumersAcc", validated.consumersAccuracy())
               .set("kappa", validated.kappa());
      }
    )
  );
  
  print("Cross-validation:")
  
  print(kfoldClassified)
  print("Average Cross-Validation (validation data)",
        kfoldClassified.aggregate_mean("ValidationAcc"))
  print("Training Matrix", kfoldClassified.aggregate_array("TrainMatrix"))
  print("Validation Matrix", kfoldClassified.aggregate_array("ValidationMatrix"))
  print("Training accuracy", kfoldClassified.aggregate_array("TrainAcc"))
  print("Validation accuracy", kfoldClassified.aggregate_array("ValidationAcc"))
  print("validation producers accuracy", kfoldClassified.aggregate_array("ProducersAcc"))
  print("validation consumers accuracy", kfoldClassified.aggregate_array("ConsumersAcc"))
  print("kappa", kfoldClassified.aggregate_array("kappa"))
  
  //validation data
  // accuracy assessment (2)
  
  var urbanfabric_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var roads_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var minedump_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var artvegareas_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var arableland_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var forests_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var scrub_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var openspaces_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var inlandwetlands_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var inlandwaters_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  var marinewaters_v = ee.FeatureCollection('ENTER_YOUR_PATH');
  
  var landCover = urbanfabric_v.merge(roads_v).merge(minedump_v).merge(artvegareas_v).merge(arableland_v).merge(forests_v).merge(scrub_v).merge(openspaces_v).merge(inlandwetlands_v).merge(inlandwaters_v).merge(marinewaters_v);
  
  print(landCover);
  
  // accuracy assessment (2)
  
  var validation2 = classified.sampleRegions({
    collection: landCover,
    properties: [classProperty],
    scale: 20,
  });
  
  
  var testAccuracy = validation2.errorMatrix(classProperty,'classification');
  var confMatrix = testAccuracy.array();
  var overAccuracy = testAccuracy.accuracy();
  var prodAccuracy = testAccuracy.producersAccuracy();
  var consAccuracy = testAccuracy.consumersAccuracy();
  var kappa2 = testAccuracy.kappa();
  
  print('Confusion Matrix 2', confMatrix);
  print('overall accuracy 2', overAccuracy);
  print('producers accuracy 2', prodAccuracy);
  print('consumers accuracy 2', consAccuracy);
  print('kappa 2', kappa2);
  
  // kocaeli
  // filtering
  
  
  var image2 = ee.ImageCollection('COPERNICUS/S2_SR')
                    .filterDate('2020-06-01', '2020-08-31')
                    .filterBounds(izmit)
                    // Pre-filter to get less cloudy granules.
                    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                    .map(maskS2clouds)
                    .mean();
                    
  
  var clip2 = image2.clip(izmit);
  
  
  var visualization = {
    min: 0.0,
    max: 0.3,
    bands: ['B4', 'B3', 'B2'],
  };
  
  Map.addLayer(clip2, visualization, 'RGB');
  
  
  //ADDITIONAL BANDS
  
  var ndvi2 = clip2.expression('(NIR-Red)/(NIR+Red)',{
    'NIR': clip2.select('B8'),
    'Red': clip2.select('B4')
  });
  
  var savi2 = clip2.expression('((NIR-Red)/(NIR+Red+0.5))*(1.0+0.5)',{
    'NIR': clip2.select('B8'),
    'Red': clip2.select('B4')
  });
  
  var ndwi2 = clip2.expression('(Green-NIR)/(Green+NIR)',{
    'NIR': clip2.select('B8'),
    'Green': clip2.select('B3')
  })  ;
  
  var mndwi2 = clip2.expression('(Green-SWIR1)/(Green+SWIR1)',{
    'SWIR1': clip2.select('B11'),
    'Green': clip2.select('B3')
  }) ;
  
  var ndbi2 = clip2.expression('(SWIR1-NIR)/(SWIR1+NIR)',{
    'SWIR1': clip2.select('B11'),
    'NIR': clip2.select('B8')
  }) ;
  
  var ui2 = clip2.expression('(SWIR2-NIR)/(SWIR2+NIR)',{
    'SWIR2': clip2.select('B12'),
    'NIR': clip2.select('B8')
  }) ;
  
  var ndti2 = clip.expression('(SWIR1-SWIR2)/(SWIR1+SWIR2)',{
    'SWIR1': clip.select('B11'),
    'SWIR2': clip.select('B12')
  }) ;
  
  var ndvire2 = clip.expression('(RedEdge1-Red)/(RedEdge1+Red)',{
    'RedEdge1': clip.select('B5'),
    'Red': clip.select('B4')
  }) ;
  
  
  
  // ADD 
  
  var final2 = clip2.addBands(ndvi2.rename('NDVI'))
                    .addBands(savi2.rename('SAVI'))
                    .addBands(ndwi2.rename('NDWI'))
                    .addBands(mndwi2.rename('mNDWI'))
                    .addBands(ndbi2.rename('NDBI'))
                    .addBands(ui2.rename('UI'));
                    
  Map.addLayer(final2, visualization, 'RGB2');
  
  // classify izmir 
  
  var classified2 = final2.select(bands).classify(trained);
  
  // display
   Map.addLayer(classified2, {min: 0, max: 10, palette: palette}, 'LCLU2');
   
  // kocaeli validation
               
  var urban_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var roads_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var mine_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var art_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var arable_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var forests_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var scrub_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var open_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var wetlans_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var inlandwaters_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  var marinewaters_izmit = ee.FeatureCollection('ENTER_YOUR_PATH');
  
  var LandCover = urban_izmit.merge(roads_izmit).merge(mine_izmit).merge(art_izmit).merge(arable_izmit).merge(forests_izmit).merge(scrub_izmit).merge(open_izmit).merge(wetlans_izmit).merge(inlandwaters_izmit).merge(marinewaters_izmit);
  
  // accuracy assessment (2)
  
  var validation3 = classified2.sampleRegions({
    collection: LandCover,
    properties: [classProperty],
    scale: 20,
  });
  
  
  var testAccuracy2 = validation3.errorMatrix(classProperty,'classification');
  var confMatrix2 = testAccuracy2.array();
  var overAccuracy2 = testAccuracy2.accuracy();
  var prodAccuracy2 = testAccuracy2.producersAccuracy();
  var consAccuracy2 = testAccuracy2.consumersAccuracy();
  var kappa3 = testAccuracy2.kappa();
  
  print('Confusion Matrix 2', confMatrix2);
  print('overall accuracy 2', overAccuracy2);
  print('producers accuracy 2', prodAccuracy2);
  print('consumers accuracy 2', consAccuracy2);
  print('kappa 3', kappa3);