public with sharing class AccountSearchAction {

    public class Request {
        @InvocableVariable(
            label='Search Term'
            description='The search term to find accounts by name'
            required=true
        )
        public String searchTerm;
    }

    public class Result {
        @InvocableVariable(
            label='Account Results'
            description='JSON string of matching accounts with Id and Name'
        )
        public String accountResults;
    }

    @InvocableMethod(
        label='Search Accounts'
        description='Searches for Salesforce accounts matching the given term'
    )
    public static List<Result> searchAccounts(List<Request> requests) {
        List<Result> results = new List<Result>();
        for (Request req : requests) {
            Result r = new Result();
            String searchKey = '%' + String.escapeSingleQuotes(req.searchTerm) + '%';
            List<Account> accounts = [
                SELECT Id, Name, BillingCity, BillingState, Phone
                FROM Account
                WHERE Name LIKE :searchKey
                WITH USER_MODE
                ORDER BY Name
                LIMIT 10
            ];
            List<Map<String, String>> accountList = new List<Map<String, String>>();
            for (Account acc : accounts) {
                Map<String, String> accMap = new Map<String, String>();
                accMap.put('Id', acc.Id);
                accMap.put('Name', acc.Name);
                accMap.put('BillingCity', acc.BillingCity != null ? acc.BillingCity : '');
                accMap.put('BillingState', acc.BillingState != null ? acc.BillingState : '');
                accMap.put('Phone', acc.Phone != null ? acc.Phone : '');
                accountList.add(accMap);
            }
            r.accountResults = JSON.serialize(accountList);
            results.add(r);
        }
        return results;
    }
}
