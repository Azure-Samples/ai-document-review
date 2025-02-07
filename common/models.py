import re
from pydantic import BaseModel, field_validator
from enum import Enum
from typing import Optional


text_max_length = 50
long_text_max_length = 50000
allowed_special_characters = r"[\[\]\,\.\!\?\:\"\'\-\(\)\_\$\£\#\@\+\=\&\%\*\!\/]"

class Location(BaseModel):
    source_sentence: str
    page_num: int
    bounding_box: list[float]
    para_index: int


class SingleShotIssue(BaseModel):
    type: str
    location: Location
    text: str
    explanation: str
    suggested_fix: str
    comment_id: str


class ConsolidatorIssue(BaseModel):
    comment_id: str
    score: int
    suggested_action: str
    reason_for_suggested_action: str


class CombinedIssue(SingleShotIssue, ConsolidatorIssue):
    pass


class AllSingleShotIssues(BaseModel):
    issues: list[SingleShotIssue]


class AllConsolidatorIssues(BaseModel):
    issues: list[ConsolidatorIssue]


class AllCombinedIssues(BaseModel):
    issues: list[CombinedIssue]


class BaseIssue(BaseModel):
    type: str
    location: Location
    text: str
    explanation: str
    suggested_fix: str


class FlowOutputChunk(BaseModel):
    issues: list[BaseIssue]


class IssueStatusEnum(str, Enum):
    accepted = 'accepted'
    dismissed = 'dismissed'
    not_reviewed = 'not_reviewed'


class ModifiedFieldsModel(BaseModel):
    suggested_fix: Optional[str] = None
    explanation: Optional[str] = None


class DismissalFeedbackModel(BaseModel):
    reason: Optional[str] = None


class Issue(BaseModel):
    id: str
    doc_id: str
    text: str
    type: str
    status: IssueStatusEnum
    suggested_fix: str
    explanation: str
    location: Optional[Location] = None
    review_initiated_by: str
    review_initiated_at_UTC: str
    resolved_by: Optional[str] = None
    resolved_at_UTC: Optional[str] = None
    modified_fields: Optional[ModifiedFieldsModel] = None
    dismissal_feedback: Optional[DismissalFeedbackModel] = None

    class Config:
        use_enum_values = True


class Agent(BaseModel):
    id: str
    type: str
    name: str
    guideline_prompt: str
    created_by: str
    created_at_UTC: str
    updated_by: Optional[str] = None
    updated_at_UTC: Optional[str] = None

    @field_validator("name", "type")
    def validate_name_and_type(cls, value):
        return validate_text(value, text_max_length)

    @field_validator("guideline_prompt")
    def validate_text(cls, value):
        return validate_text(value, long_text_max_length)

class CreateAgent(BaseModel):
    name: str
    guideline_prompt: str
    type: str

    @field_validator("name", "type")
    def validate_name_and_type(cls, value):
        return validate_text(value, text_max_length)

    @field_validator("guideline_prompt")
    def validate_guidelines_prompt(cls, value):
        return validate_text(value, long_text_max_length)

class UpdateAgent(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    guideline_prompt: Optional[str] = None

    
    @field_validator("name", "type")
    def validate_name_and_type(cls, value):
        if value:
            return validate_text(value, text_max_length)
        return value

    @field_validator("guideline_prompt")
    def validate_text(cls, value):
        if value:
            return validate_text(value, long_text_max_length)
        return value


def validate_text(value, length_limit):
    """
    Validate the text value.
    
    Ensures that the provided value is not an empty string, adheres to the specified 
    length limit, and does not include disallowed special characters.

    Args:
        value (str): The field value to validate.
        length_limit (int): The maximum length allowed for the field value.

    Returns:
        str: The validated field value.
    """
    if not value:
        raise ValueError(f"Value cannot be empty")
    text_length = len(value.strip())
    if text_length == 0 or text_length > length_limit:
        raise ValueError(f"Value must be between 1 to {length_limit} characters long.")
    disallowed_pattern = r"[^\w\s" + re.escape(allowed_special_characters) + "]"
    if re.search(disallowed_pattern, value):
        raise ValueError(f"Value contains disallowed special characters.")
    return value
