# Model Validation Flow

## Goals

* Prevent incompatible models from loading.

* Ensure feature-count stability.

* Guarantee numpy/sklearn version compatibility.

* Maintain reproducibility through metadata.

## Runtime Validation (FastAPI Startup)

* Load model + manifest.

* Validate:

  * File existence

  * feature_names present

  * model.n_features_in_ == len(feature_names)

  * numpy/sklearn version match

* If any mismatch: raise RuntimeError → fail fast.

## CI Validation

* `backend/ci/validate_model.py` executed in GitHub Actions.

* Performs same checks as startup validation.

* Fails CI on mismatch.

## Benefits

* Prevents silent prediction errors.

* Guarantees reproducible deployments.

* Protects you from "model was trained in a different environment" issues.

