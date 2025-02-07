from promptflow import tool  

from common.models import AllSingleShotIssues, AllConsolidatorIssues, CombinedIssue, AllCombinedIssues
  
# The inputs section will change based on the arguments of the tool function, after you save the code  
# Adding type to arguments and return value will help the system show the types properly  
# Please update the function name/signature per need  
@tool  
def merge_singleshot_fields_with_consolidator(agg_outputs: str, consolidator_outputs: list) -> str:
    # Validate and load the JSON strings into Python dictionaries  
    assert len(consolidator_outputs) == 1
    left_data = AllConsolidatorIssues.parse_raw(consolidator_outputs[0])
    right_data = AllSingleShotIssues.parse_raw(agg_outputs)
    
    combined_issues = []
    # Merge the data based on the comment_id  
    for left_issue in left_data.issues:  
        for right_issue in right_data.issues:  
            if left_issue.comment_id == right_issue.comment_id:
                combined_issue = CombinedIssue(**dict(left_issue, **dict(right_issue)))
                # Drop the combined issue if suggested_action from consolidator agent is "REMOVE"
                # Usually consolidator agent will suggest "REMOVE" action for issues with low score
                if combined_issue.suggested_action != "REMOVE":
                    combined_issues.append(combined_issue)

    return AllCombinedIssues(issues=combined_issues).model_dump_json()