class SearchFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
        // console.log(this.query, this.queryStr);
    }

    search() {
        // Check if there's a keyword in the query string
        const keyword = this.queryStr.keyword ? {
            $or: [
                {
                    firstName: {
                        $regex: this.queryStr.keyword,
                        $options: 'i' // Case-insensitive
                    }
                },
                {
                    middleName: {
                        $regex: this.queryStr.keyword,
                        $options: 'i' // Case-insensitive
                    }
                },
                {
                    lastName: {
                        $regex: this.queryStr.keyword,
                        $options: 'i' // Case-insensitive
                    }
                },
                {
                    lrn: {
                        $regex: this.queryStr.keyword,
                        $options: 'i' // Case-insensitive
                    }
                }
            ]
        } : {};

        // Add the keyword search criteria to the query
        this.query = this.query.find({ ...keyword });
        return this;
    }
}

module.exports = SearchFeatures;
