#!/usr/bin/env python3
"""
Setup script for HireFlow Model Training & Improvement
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="hireflow-model-trainer",
    version="1.0.0",
    author="Somrik Sur",
    author_email="somriksur@gmail.com",
    description="HireFlow AI Interview Question Generation Model Training & Improvement Suite",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/somriksur/HireFlow-Qwen-Fresh-Pro-Improve",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.5.0",
        ],
        "monitoring": [
            "tensorboard>=2.14.0",
            "wandb>=0.15.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "hireflow-train=train_fresh_model:main",
            "hireflow-improve=fine_tune_to_90_percent:main",
            "hireflow-test=test_model_accuracy:main",
            "hireflow-generate-data=generate_training_data:main",
        ],
    },
)