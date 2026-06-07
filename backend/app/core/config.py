from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    supabase_url: AnyHttpUrl = Field(alias="SUPABASE_URL")
    supabase_anon_key: str = Field(alias="SUPABASE_ANON_KEY", min_length=1)
    supabase_service_role_key: str = Field(alias="SUPABASE_SERVICE_ROLE_KEY", min_length=1)
    admin_dev_auth_enabled: bool = Field(default=False, alias="ADMIN_DEV_AUTH_ENABLED")
    admin_dev_token: str = Field(default="", alias="ADMIN_DEV_TOKEN")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    hf_api_key: str = Field(default="", alias="HF_API_KEY")

    @field_validator("supabase_url", mode="before")
    @classmethod
    def strip_url(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().strip("'\"")
        return v

    @field_validator(
        "supabase_anon_key",
        "supabase_service_role_key",
        "admin_dev_token",
        "groq_api_key",
        "gemini_api_key",
        "hf_api_key",
        mode="before",
    )
    @classmethod
    def strip_keys(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().strip("'\"")
        return v

    model_config = SettingsConfigDict(
        env_file=ROOT_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
