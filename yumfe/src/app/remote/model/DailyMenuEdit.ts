/**
 * Yum Food Orders
 * **Yum application, order food daily from the best chef in town**  This API is used by the angular.io client, and is not meant to be used otherwise.  Find source code of this API [here](http://gitlab/)  Copyright (C) 2017 JR Technologies.     ------------------------------------       Last edit: 21/04/2017 15:00   -------------------------------------
 *
 * OpenAPI spec version: 1.0.7
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */

import * as models from './models';

export interface DailyMenuEdit {
    foods?: Array<models.DailyMenusFoods>;

    lastEdit?: models.LastEdit;

    date?: Date;

}
