-- 은행별 이의제기 안내. 대표번호·홈페이지만 넣고 절차 세부는 은행에 확인하도록 안내한다.
-- TODO: 출시 전 각 은행 공식 안내로 다시 확인
UPDATE banks SET objection_channel = '지급정지된 계좌의 은행 영업점 또는 고객센터', updated_at = now();
UPDATE banks SET phone = '1588-9999', guide_url = 'https://www.kbstar.com' WHERE code = '004';
UPDATE banks SET phone = '1599-8000', guide_url = 'https://www.shinhan.com' WHERE code = '088';
UPDATE banks SET phone = '1588-5000', guide_url = 'https://www.wooribank.com' WHERE code = '020';
UPDATE banks SET phone = '1599-1111', guide_url = 'https://www.kebhana.com' WHERE code = '081';
UPDATE banks SET phone = '1661-3000', guide_url = 'https://banking.nonghyup.com' WHERE code = '011';
