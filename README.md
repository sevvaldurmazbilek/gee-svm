# gee-svm
Comparison of different machine learning techniques for land cover classification : A case study from Istanbul Metropolitan City


Land cover information has a critical role in the sustainable development of cities, resource management, urban planning, and landscape change analysis. With the versatile availability of multi-sensor remotely sensed data, geospatial big data has been widely used in land cover mapping applications recently which has ben supported with open-source geospatial data and cloud-based platforms. In this research, I aimed to generate a highly accurate land cover map of Istanbul Metropolitan City using different machine learning approaches and analyze generalization capability and transferability of the machine learning models to independent test sites. 

-I used the time series of Sentinel-2 images and the Google Earth Engine (GEE) platform to produce land cover maps. 
![image](https://github.com/sevvaldurmazbilek/gee-svm/assets/59259659/031b3701-9937-469c-98d8-3eb145609581)

-A total of 20 different experiments were conducted by creating 5 separate datasets, which have different classification input parameters and by implementing Classification and Regression Trees (CART), Random Forest (RF), Support Vector Machine (SVM) and Naive Bayes machine learning algorithms. 

<img width="542" alt="image" src="https://github.com/sevvaldurmazbilek/gee-svm/assets/59259659/e3d1fb44-269f-4e01-bce5-e30c9c755687">


-In the implementation of the SVM algorithm, a Grid Search application was carried out to optimize SVM hyperparameters. 

-Accuracy assessment in all classification experiments was obtained using the k-fold-cross-validation technique and generating confusion matrix with the use of independent validation points. 

<img width="734" alt="image" src="https://github.com/sevvaldurmazbilek/gee-svm/assets/59259659/20b7d3ef-7bc3-459f-b923-19f36fa7f9d8">

<img width="731" alt="image" src="https://github.com/sevvaldurmazbilek/gee-svm/assets/59259659/0a39c847-0aa8-445f-99ae-44d35c301411">


-I comprehensively analyzed the accuracy of different machine learning algorithms and the impact of  different dataset combinations on highly detailed land cover mapping. 

![image](https://github.com/sevvaldurmazbilek/gee-svm/assets/59259659/c3477c80-716a-4b6f-8511-276ed33bec92)


-Finally, a test land cover classification was conducted in another city, without using training data, by utilizing the classification coefficients of the dataset-algorithm combination that produced the highest accuracy to explain the transferability of the produced coefficients to independent test sites. 

![image](https://github.com/sevvaldurmazbilek/gee-svm/assets/59259659/e29e22d5-f6c0-4d59-b99c-8fb9e3e787bb)

