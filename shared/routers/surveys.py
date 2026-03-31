"""
Authenticated survey management endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from shared.compat import get_current_user
from shared.database import get_db
from shared.models.surveys import Question
from shared.schemas.surveys import (
    QuestionCreate,
    QuestionOut,
    QuestionUpdate,
    ResponseOut,
    ResponseSummary,
    SurveyCreate,
    SurveyOut,
    SurveySummary,
    SurveyUpdate,
)
from shared.services.survey_service import (
    add_question,
    create_survey,
    delete_question,
    delete_survey,
    export_responses_csv,
    get_response,
    get_responses,
    get_survey,
    list_surveys,
    response_count,
    update_question,
    update_survey,
)

router = APIRouter()


def _survey_or_404(survey_id: str, db: Session):
    survey = get_survey(db, survey_id)
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


def _question_or_404(question_id: str, survey_id: str, db: Session):
    q = db.query(Question).filter(
        Question.id == question_id, Question.survey_id == survey_id
    ).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


# ── Surveys ────────────────────────────────────────────────────────────────────

@router.post("", response_model=SurveyOut, status_code=201)
def create(body: SurveyCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    created_by = getattr(user, "email", None)
    survey = create_survey(db, body, created_by=created_by)
    survey.response_count = 0
    return survey


@router.get("", response_model=list[SurveySummary])
def list_all(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    surveys = list_surveys(db, skip=skip, limit=limit)
    for s in surveys:
        s.response_count = response_count(db, s.id)
    return surveys


@router.get("/{survey_id}", response_model=SurveyOut)
def get_one(survey_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    survey = _survey_or_404(survey_id, db)
    survey.response_count = response_count(db, survey_id)
    return survey


@router.put("/{survey_id}", response_model=SurveyOut)
def update(
    survey_id: str,
    body: SurveyUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    survey = _survey_or_404(survey_id, db)
    survey = update_survey(db, survey, body)
    survey.response_count = response_count(db, survey_id)
    return survey


@router.delete("/{survey_id}", status_code=204)
def delete(survey_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    survey = _survey_or_404(survey_id, db)
    delete_survey(db, survey)


# ── Questions ──────────────────────────────────────────────────────────────────

@router.post("/{survey_id}/questions", response_model=QuestionOut, status_code=201)
def add_q(
    survey_id: str,
    body: QuestionCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    survey = _survey_or_404(survey_id, db)
    return add_question(db, survey, body)


@router.put("/{survey_id}/questions/{question_id}", response_model=QuestionOut)
def update_q(
    survey_id: str,
    question_id: str,
    body: QuestionUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _survey_or_404(survey_id, db)
    question = _question_or_404(question_id, survey_id, db)
    return update_question(db, question, body.model_dump(exclude_unset=True))


@router.delete("/{survey_id}/questions/{question_id}", status_code=204)
def delete_q(
    survey_id: str,
    question_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _survey_or_404(survey_id, db)
    question = _question_or_404(question_id, survey_id, db)
    delete_question(db, question)


# ── Responses ──────────────────────────────────────────────────────────────────

@router.get("/{survey_id}/responses", response_model=list[ResponseSummary])
def list_responses(
    survey_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _survey_or_404(survey_id, db)
    return get_responses(db, survey_id)


@router.get("/{survey_id}/responses/{response_id}", response_model=ResponseOut)
def get_one_response(
    survey_id: str,
    response_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _survey_or_404(survey_id, db)
    resp = get_response(db, response_id, survey_id)
    if not resp:
        raise HTTPException(status_code=404, detail="Response not found")
    return resp


@router.get("/{survey_id}/export")
def export_csv(
    survey_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    survey = _survey_or_404(survey_id, db)
    responses = get_responses(db, survey_id)
    csv_content = export_responses_csv(survey, responses)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="survey-{survey_id}-responses.csv"'
        },
    )
